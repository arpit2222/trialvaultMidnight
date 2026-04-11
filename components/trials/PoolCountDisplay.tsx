"use client";

import { motion } from "framer-motion";

/**
 * PoolCountDisplay animates aggregate counts without exposing any identities.
 */
export function PoolCountDisplay({ count }: { count: number }) {
  return (
    <motion.div
      key={count}
      initial={{ scale: 0.95, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="text-4xl font-semibold text-white"
    >
      {count}
    </motion.div>
  );
}
