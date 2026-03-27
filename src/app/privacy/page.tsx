import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Noetic",
  description: "Privacy policy and terms of service for Noetic AI reasoning platform.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-500/30">
      <header className="px-6 py-4 border-b border-slate-200 sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-md hover:bg-slate-100 transition-colors mr-2">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center text-lg font-semibold text-slate-900">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            <span>Noetic Privacy Policy</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-bold mb-6 tracking-tight">Privacy & Data Handling</h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Effective Date: March 2026. This page details how Noetic handles your data during AI reasoning tasks.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">1. Data Isolation</h2>
            <p className="text-slate-600 leading-relaxed">
              Noetic operates on an isolated AI reasoning model. Your prompts, conversation history, and uploaded documents 
              are processed strictly within your authenticated session context. We do not use your private data to train 
              our foundational models unless explicitly opted-in.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">2. Telemetry and Usage</h2>
            <p className="text-slate-600 leading-relaxed">
              To improve our services, we collect anonymized telemetry data, including latency metrics, error rates, and 
              general usage patterns. This data cannot be traced back to individual users or workspaces without consent.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">3. Local Caching & Redis</h2>
            <p className="text-slate-600 leading-relaxed">
              For performance optimization, our reasoning traces are cached locally via Redis. This caching is ephemeral 
              and respects Time-to-Live (TTL) policies. You have the right to request the immediate invalidation of your 
              cached traces at any time via the API or dashboard settings.
            </p>
          </section>

          <section className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              For security concerns or data removal requests, please contact our privacy compliance team.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
