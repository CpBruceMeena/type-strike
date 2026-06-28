"use client";

import { motion } from "framer-motion";

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export default function BlurText({
  text,
  delay = 120,
  className = "",
  as: Tag = "span",
}: BlurTextProps) {
  const words = text.split(" ");

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block">
          <motion.span
            className="inline-block"
            initial={{ filter: "blur(12px)", opacity: 0 }}
            animate={{ filter: "blur(0px)", opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: (i * delay) / 1000,
              ease: "easeOut",
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </Tag>
  );
}
