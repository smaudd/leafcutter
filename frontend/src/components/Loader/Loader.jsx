import { useEffect, useRef } from "react";
import color from "../../services/color";
import styles from "./Loader.module.css";

export default function Loader() {
  const frameRef = useRef(null);

  useEffect(() => {
    if (frameRef.current) {
      const randomColorStart = color.getRandomColor();
      const randomColorEnd = color.getRandomColor();

      // Set CSS variables dynamically
      frameRef.current.style.setProperty("--color-start", randomColorStart);
      frameRef.current.style.setProperty("--color-end", randomColorEnd);

      // Optionally set the data attributes (not necessary for functionality)
      frameRef.current.setAttribute("data-color-start", randomColorStart);
      frameRef.current.setAttribute("data-color-end", randomColorEnd);
    }
  }, []); // Run only once when the component mounts

  return (
    <div className={styles["loader"]} data-testid="loader">
      <div className={styles["frames"]}>
        <span ref={frameRef} className={styles["frame"]}></span>
      </div>
    </div>
  );
}
