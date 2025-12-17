"use client";

import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { ComponentProps, forwardRef } from "react";

// Extend button props but override ref slightly for motion compat if needed, 
// though usually just wrapping the shadcn Button in motion works or passing it as a component.
// Here we'll wrap a motion.div (or span) around it or turn the button itself into a motion component.

const MotionButtonBase = motion(Button);

export const MotionButton = forwardRef<HTMLButtonElement, ButtonProps & ComponentProps<typeof motion.button>>((props, ref) => {
  return (
    <MotionButtonBase
      ref={ref}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    />
  );
});

MotionButton.displayName = "MotionButton";
