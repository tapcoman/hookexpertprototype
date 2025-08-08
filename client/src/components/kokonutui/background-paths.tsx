import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play } from 'lucide-react'

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full text-red-500 dark:text-red-500" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={Math.min(0.1 + path.id * 0.015, 0.35)}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export default function BackgroundPaths({
  title = "Background Paths",
}: {
  title?: string
}) {
  const words = title.split(" ")

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      {/* Subtle modern gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft radial blobs */}
        <div className="absolute -top-32 -left-24 h-[680px] w-[680px] rounded-full blur-3xl opacity-70 dark:opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, rgba(244,63,94,0.18), rgba(244,63,94,0.12), transparent 70%)"
          }}
          aria-hidden="true"
        />
        <div className="absolute -bottom-40 -right-28 h-[820px] w-[820px] rounded-full blur-3xl opacity-70 dark:opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, rgba(234,88,12,0.16), rgba(234,88,12,0.10), transparent 70%)"
          }}
          aria-hidden="true"
        />
        {/* Faint linear wash */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(244,63,94,0.06), rgba(234,88,12,0.06))"
          }}
          aria-hidden="true"
        />
      </div>

      {/* Animated paths overlay */}
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text 
                                bg-gradient-to-r from-neutral-900 to-neutral-700/80 
                                dark:from-white dark:to-white/80"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3">
            {/* Discover Excellence */}
            <div
              className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10 
                          dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                          overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <Button
                variant="ghost"
                className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                           bg-white/95 hover:bg-white/100 dark:bg-black/95 dark:hover:bg-black/100 
                           text-black dark:text-white transition-all duration-300 
                           group-hover:-translate-y-0.5 border border-black/10 dark:border-white/10
                           hover:shadow-md dark:hover:shadow-neutral-800/50"
              >
                <span className="opacity-90 group-hover:opacity-100 transition-opacity">Discover Excellence</span>
                <span
                  className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                              transition-all duration-300"
                  aria-hidden="true"
                >
                  →
                </span>
              </Button>
            </div>

            {/* Watch demo */}
            <div
              className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10 
                          dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                          overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <Button
                variant="ghost"
                className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                           bg-white/95 hover:bg-white/100 dark:bg-black/95 dark:hover:bg-black/100 
                           text-black dark:text-white transition-all duration-300 
                           group-hover:-translate-y-0.5 border border-black/10 dark:border-white/10
                           hover:shadow-md dark:hover:shadow-neutral-800/50"
                aria-label="Watch demo"
              >
                <Play className="mr-3 h-5 w-5 opacity-80 group-hover:opacity-100 transition-opacity" />
                <span className="opacity-90 group-hover:opacity-100 transition-opacity">Watch demo</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
