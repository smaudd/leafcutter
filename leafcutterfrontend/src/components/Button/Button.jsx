import styles from "./Button.module.css";

export default function Button({ children, testid = null, onClick }) {
  return (
    <button onClick={onClick} className={styles["button"]} data-testid={testid}>
      {children}
    </button>
  );
}
