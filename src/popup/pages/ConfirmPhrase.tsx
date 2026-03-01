import { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, X } from "lucide-react";
import { useWalletContext } from "../App";
import { getRandomWordsForVerification } from "@/crypto/recovery";

export function ConfirmPhrase() {
  const { navigate, recoveryPhrase } = useWalletContext();
  const words = recoveryPhrase ? recoveryPhrase.split(" ") : [];

  // Pick 3 random words on mount (useRef persists across re-renders)
  const challengeRef = useRef(
    recoveryPhrase ? getRandomWordsForVerification(recoveryPhrase, 3) : []
  );
  const challenge = challengeRef.current;

  // Generate decoy options for each challenge word
  const options = useMemo(() => {
    return challenge.map(({ index, word }) => {
      // Get 3 random decoy words (different from the correct word)
      const decoys: string[] = [];
      const usedIndices = new Set<number>([index]);
      while (decoys.length < 3 && usedIndices.size < words.length) {
        const randIdx = Math.floor(Math.random() * words.length);
        if (!usedIndices.has(randIdx)) {
          usedIndices.add(randIdx);
          decoys.push(words[randIdx]);
        }
      }
      // Combine correct + decoys and shuffle
      const all = [word, ...decoys];
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      return all;
    });
  }, [challenge, words]);

  const [selections, setSelections] = useState<(string | null)[]>(
    Array(challenge.length).fill(null)
  );

  const handleSelect = (challengeIdx: number, word: string) => {
    setSelections((prev) => {
      const next = [...prev];
      next[challengeIdx] = word;
      return next;
    });
  };

  const getStatus = (
    challengeIdx: number
  ): "idle" | "correct" | "incorrect" => {
    const selected = selections[challengeIdx];
    if (selected === null) return "idle";
    return selected === challenge[challengeIdx].word ? "correct" : "incorrect";
  };

  const allCorrect = challenge.every(
    (c, i) => selections[i] === c.word
  );

  return (
    <div className="flex-1 flex flex-col px-6 py-5 overflow-y-auto">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => navigate("recovery-phrase")}
          className="p-1.5 rounded-lg hover:bg-lockbox-surface transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} className="text-lockbox-text-secondary" />
        </button>
        <h1 className="text-lg font-semibold text-lockbox-text">
          Confirm your recovery phrase
        </h1>
      </motion.div>

      <motion.p
        className="text-xs text-lockbox-text-secondary mb-6 leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Select the correct word for each position to verify you saved your
        recovery phrase.
      </motion.p>

      {/* Challenge prompts */}
      <div className="flex flex-col gap-5">
        {challenge.map((c, challengeIdx) => {
          const status = getStatus(challengeIdx);
          return (
            <motion.div
              key={c.index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + challengeIdx * 0.1, duration: 0.35 }}
            >
              {/* Prompt label */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium text-lockbox-text">
                  Word #{c.index + 1}
                </span>
                {status === "correct" && (
                  <motion.div
                    className="flex items-center gap-1"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <div className="w-5 h-5 rounded-full bg-lockbox-accent/15 flex items-center justify-center">
                      <Check size={12} className="text-lockbox-accent" />
                    </div>
                  </motion.div>
                )}
                {status === "incorrect" && (
                  <motion.div
                    className="flex items-center gap-1"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <div className="w-5 h-5 rounded-full bg-lockbox-danger/15 flex items-center justify-center">
                      <X size={12} className="text-lockbox-danger" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Options grid */}
              <div className="grid grid-cols-2 gap-2">
                {options[challengeIdx].map((word) => {
                  const isSelected = selections[challengeIdx] === word;
                  const isCorrectWord = word === c.word;

                  let borderColor = "border-lockbox-border";
                  let bgColor = "bg-lockbox-surface";
                  let textColor = "text-lockbox-text-secondary";

                  if (isSelected && isCorrectWord) {
                    borderColor = "border-lockbox-accent";
                    bgColor = "bg-lockbox-accent/10";
                    textColor = "text-lockbox-accent";
                  } else if (isSelected && !isCorrectWord) {
                    borderColor = "border-lockbox-danger";
                    bgColor = "bg-lockbox-danger/10";
                    textColor = "text-lockbox-danger";
                  } else if (isSelected) {
                    borderColor = "border-lockbox-accent";
                    bgColor = "bg-lockbox-accent/5";
                    textColor = "text-lockbox-text";
                  }

                  return (
                    <button
                      key={word}
                      onClick={() => handleSelect(challengeIdx, word)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium
                                  transition-all duration-200 cursor-pointer
                                  hover:border-lockbox-border-hover
                                  ${borderColor} ${bgColor} ${textColor}`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Verify button */}
      <motion.div
        className="mt-auto pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <button
          onClick={() => navigate("wallet-ready")}
          disabled={!allCorrect}
          className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide
                     transition-all duration-200 cursor-pointer
                     disabled:opacity-40 disabled:cursor-not-allowed
                     hover:shadow-lg hover:shadow-lockbox-accent/20 active:scale-[0.98]"
          style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
        >
          Verify
        </button>
      </motion.div>
    </div>
  );
}
