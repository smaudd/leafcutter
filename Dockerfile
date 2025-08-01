FROM golang:1.21

WORKDIR /app
COPY indexer/main.go .
RUN go build -o indexer main.go

ENTRYPOINT ["./indexer"]
