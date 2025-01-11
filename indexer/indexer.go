package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"github.com/sqweek/dialog"
)

type FileIndex struct {
	Name     string `json:"name"`
	File     string `json:"file,omitempty"`
	Type     string `json:"type"`
	Format   string `json:"format,omitempty"`
	Size     int64  `json:"size,omitempty"`
	Checksum string `json:"checksum,omitempty"`
	Dir      string `json:"dir,omitempty"`
}

type IndexingManager struct {
	SupportedFormats []string
	ExcludedFiles    []string
}


func selectFolderPrompt() (string, error) {
	// Show the initial message dialog to inform the user
	dialog.Message("Please select a folder to index").Title("Folder Selection").Info()

	// Open the folder selection dialog after the message
	dirPath, err := dialog.Directory().Title("Select Folder to Index").Browse()
	if err != nil {
		return "", fmt.Errorf("error selecting folder: %v", err)
	}

	// Check if the directory exists
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		return "", fmt.Errorf("directory does not exist: %s", dirPath)
	}

	return dirPath, nil
}

// Create a new IndexingManager
func NewIndexingManager() *IndexingManager {
	return &IndexingManager{
		SupportedFormats: []string{"mp3", "wav", "flac", "ogg", "tiff", "midi"},
		ExcludedFiles:    []string{".DS_Store"},
	}
}

// Calculate the MD5 checksum of data
func (im *IndexingManager) calculateChecksum(data []byte) string {
	hash := md5.Sum(data)
	return hex.EncodeToString(hash[:])
}

// Check if a file is supported
func (im *IndexingManager) isSupportedFile(file string) bool {
	ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(file)), ".")
	return contains(im.SupportedFormats, ext) && !contains(im.ExcludedFiles, file)
}

func (im *IndexingManager) generateIndex(dir string, rootDir string) (map[string]FileIndex, error) {
    index := make(map[string]FileIndex)

    files, err := os.ReadDir(dir)
    if err != nil {
        return nil, err
    }

    // Remove the root directory part from the path for relative calculation

    for _, file := range files {
        fullPath := filepath.Join(dir, file.Name())
        relativePath, _ := filepath.Rel(rootDir, fullPath) // Compute relative path from root directory

        // Skip hidden folders (like .git) and the _search folder inside root
        if file.IsDir() && (strings.HasPrefix(file.Name(), ".") || file.Name() == "_search" || strings.Contains(file.Name(), ".git")) {
            continue
        }

        if file.IsDir() {
            index[file.Name()] = FileIndex{
                Type: "directory",
                Name: file.Name(),
                Dir:  "/" + relativePath,  // Correct for directories
            }
        } else if im.isSupportedFile(file.Name()) {
            fileBuffer, err := os.ReadFile(fullPath)
            if err != nil {
                return nil, err
            }
            checksum := im.calculateChecksum(fileBuffer)

            info, err := os.Stat(fullPath)
            if err != nil {
                return nil, err
            }

            // Dynamically build the file path based on the root directory
            filePath := "/" + relativePath

            index[file.Name()] = FileIndex{
                Type:     "file",
                Name:     file.Name(),
                File:     filePath, // Dynamically set the file path
                Format:   strings.TrimPrefix(filepath.Ext(file.Name()), "."),
                Size:     info.Size(),
                Checksum: checksum,
            }
        }
    }

	// Correct file path for the root directory
	indexPath := filepath.Join(dir, "index.json")
	fmt.Printf("Attempting to save index to: %s\n", indexPath) // Debug log

	// Use json.Encoder with SetEscapeHTML set to false to prevent escaping characters like '&' and "'"
	file, err := os.Create(indexPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetEscapeHTML(false) // Disable escaping of HTML special characters

	err = encoder.Encode(map[string]map[string]FileIndex{"content": index})
	if err != nil {
		return nil, err
	}

	fmt.Println("Index successfully saved to:", indexPath) // Debug log
	return index, nil

}



// Recursively process directories and index files
func (im *IndexingManager) processDirectoryRecursively(dir string, globalIndex *[]FileIndex, rootDir string) error {
	files, err := os.ReadDir(dir)
	if err != nil {
		return err
	}

	for _, file := range files {
		fullPath := filepath.Join(dir, file.Name())
		if file.IsDir() && !strings.HasPrefix(file.Name(), ".") {
			subDirIndex, err := im.generateIndex(fullPath, rootDir)
			if err != nil {
				return err
			}

			for _, v := range subDirIndex {
				*globalIndex = append(*globalIndex, v)
			}
			err = im.processDirectoryRecursively(fullPath, globalIndex, rootDir)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// Calculate checksum for top-level directory
func (im *IndexingManager) calculateTopLevelChecksum(dir string) (string, error) {
	var contentNames []string

	err := filepath.Walk(dir, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		contentNames = append(contentNames, info.Name())
		return nil
	})
	if err != nil {
		return "", err
	}

	sort.Strings(contentNames)
	joinedNames := strings.Join(contentNames, ",")
	return im.calculateChecksum([]byte(joinedNames)), nil
}

// Generate an index directory with pagination
func (im *IndexingManager) generateIndexDirectory(dir string, rootDir string) error {
	checksumPath := filepath.Join(dir, "top_level_checksum.txt")

	var previousChecksum string
	if data, err := os.ReadFile(checksumPath); err == nil {
		previousChecksum = string(data)
	}

	currentChecksum, err := im.calculateTopLevelChecksum(dir)
	if err != nil {
		return err
	}

	if currentChecksum == previousChecksum {
		fmt.Println("No changes detected. Skipping reindexing.")
		return nil
	}

	fmt.Println("Changes detected. Reindexing...")
	err = os.WriteFile(checksumPath, []byte(currentChecksum), 0644)
	if err != nil {
		return err
	}

	var globalIndex []FileIndex
	err = im.processDirectoryRecursively(dir, &globalIndex, rootDir)
	if err != nil {
		return err
	}

	// Paginate and save index
	const pageSize = 100
	searchDir := filepath.Join(dir, "_search")
	os.MkdirAll(searchDir, 0755)

	totalPages := (len(globalIndex) + pageSize - 1) / pageSize
	for i := 0; i < totalPages; i++ {
		start := i * pageSize
		end := start + pageSize
		if end > len(globalIndex) {
			end = len(globalIndex)
		}

		paginatedIndex := globalIndex[start:end]
		paginatedIndexPath := filepath.Join(searchDir, fmt.Sprintf("%d.json", i+1))

		pageData, err := json.MarshalIndent(map[string]interface{}{
			"content":     paginatedIndex,
			"next":        i < totalPages-1,
			"totalPages":  totalPages,
			"totalCount":  len(globalIndex),
		}, "", "  ")
		if err != nil {
			return err
		}

		err = os.WriteFile(paginatedIndexPath, pageData, 0644)
		if err != nil {
			return err
		}

		fmt.Printf("Paginated index saved for page %d\n", i+1)
	}

	fmt.Println("Global index pagination complete.")
	return nil
}

// Helper function to check if a string is in a slice
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func main() {
	// dir := "/Users/work/Documents/samples_test" // Change this to your desired directory
    selectedFolder, err := selectFolderPrompt()
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
	manager := NewIndexingManager()

	dirErr := manager.generateIndexDirectory(selectedFolder, selectedFolder)

	if dirErr != nil {
		fmt.Printf("Error: %v\n", err)
	}
}