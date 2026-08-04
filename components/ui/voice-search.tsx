"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function VoiceSearch({ onSearch, className }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if Speech Recognition is supported
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);

        if (event.results[current].isFinal) {
          onSearch(transcript);
          setIsListening(false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onSearch]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={toggleListening}
        className={cn(
          "flex items-center justify-center rounded-full p-3 transition",
          isListening
            ? "bg-red-500 text-white animate-pulse"
            : "border border-stone-200 text-stone-600 hover:border-[#8B4513] hover:text-[#8B4513]"
        )}
        aria-label={isListening ? "Stop listening" : "Start voice search"}
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {isListening && (
        <div className="absolute top-full right-0 mt-2 w-80 rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Mic size={24} className="text-red-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Listening...</h3>
              <p className="text-xs text-stone-600">Speak now</p>
            </div>
          </div>

          {transcript && (
            <div className="mt-4 rounded-[16px] bg-[#fff8f1] p-3">
              <p className="text-sm text-stone-700 italic">"{transcript}"</p>
            </div>
          )}

          <button
            onClick={toggleListening}
            className="mt-4 w-full rounded-full border border-stone-200 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
