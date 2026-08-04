"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  answer?: string;
  author: string;
  date: string;
  likes: number;
  isVerified: boolean;
}

interface CustomerQAProps {
  questions: Question[];
  className?: string;
}

export function CustomerQA({ questions, className }: CustomerQAProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={cn("rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-sm", className)}>
      <div className="flex items-center gap-3">
        <MessageCircle size={24} className="text-[#8B4513]" />
        <h3 className="text-xl font-semibold text-stone-900">Questions & Answers</h3>
      </div>

      <div className="mt-6 space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded-[20px] border border-stone-200/70 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-stone-900">{q.question}</p>
                <div className="mt-2 flex items-center gap-3 text-sm text-stone-600">
                  <span>{q.author}</span>
                  <span>•</span>
                  <span>{q.date}</span>
                  {q.isVerified && (
                    <>
                      <span>•</span>
                      <span className="text-green-600">Verified Purchase</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleExpand(q.id)}
                className="rounded-full p-2 transition hover:bg-stone-100"
                aria-label="Toggle answer"
              >
                <ChevronDown
                  size={20}
                  className={cn("transition-transform", expandedId === q.id && "rotate-180")}
                />
              </button>
            </div>

            {expandedId === q.id && q.answer && (
              <div className="mt-4 rounded-[16px] bg-[#fff8f1] p-4">
                <p className="text-sm text-stone-700">{q.answer}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button className="flex items-center gap-1 text-sm text-stone-600 transition hover:text-[#8B4513]">
                    <ThumbsUp size={16} />
                    <span>Helpful ({q.likes})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-stone-900">Ask a Question</h4>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 rounded-full border border-stone-200 px-4 py-2 text-sm outline-none transition focus:border-[#8B4513]"
          />
          <button className="rounded-full bg-[#8B4513] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#6d3410]">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}