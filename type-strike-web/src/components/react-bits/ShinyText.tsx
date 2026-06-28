"use client";

import { motion } from "framer-motion";

interface ShinyTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  color?: string;
  glowColor?: string;
}

export default function ShinyText({
  text,
  className = "",
  as: Tag = "span",
  color = "#e8eaf2",
  glowColor = "rgba(6, 182, 212, 0.5)",
}: ShinyTextProps) {
  return (
    <Tag
      className={`relative inline-block ${className}`}
      style={{ color }}
      aria-label={text}
    >
      <motion.span
        className="inline-block bg-clip-text text-transparent"
        style={{
          backgroundImage: `linear-gradient(135deg, ${color} 0%, ${glowColor} 50%, ${color} 100%)`,
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.span>
    </Tag>
  );
}
