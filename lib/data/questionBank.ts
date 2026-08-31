import type { Question } from "@/lib/types";

// Curated question bank, ~30-50 common interview questions across the
// categories called for in the source spec §10.
export const QUESTION_BANK: Question[] = [
  // Behavioral
  { id: "b1", category: "behavioral", text: "Tell me about a time you led a project from start to finish." },
  { id: "b2", category: "behavioral", text: "Describe a situation where you disagreed with a coworker. How did you handle it?" },
  { id: "b3", category: "behavioral", text: "Tell me about a time you failed. What did you learn?" },
  { id: "b4", category: "behavioral", text: "Give an example of a goal you set and how you achieved it." },
  { id: "b5", category: "behavioral", text: "Describe a time you had to work under a tight deadline." },
  { id: "b6", category: "behavioral", text: "Tell me about a time you received difficult feedback." },
  { id: "b7", category: "behavioral", text: "Describe a time you had to persuade someone to see things your way." },
  { id: "b8", category: "behavioral", text: "Tell me about a time you went above and beyond for a customer or teammate." },
  { id: "b9", category: "behavioral", text: "Describe a situation where you had to learn something new quickly." },
  { id: "b10", category: "behavioral", text: "Tell me about a time you made a mistake at work. What happened?" },
  { id: "b11", category: "behavioral", text: "Describe a time you had to manage multiple priorities at once." },
  { id: "b12", category: "behavioral", text: "Tell me about a time you took initiative without being asked." },
  { id: "b13", category: "behavioral", text: "Describe a conflict within a team you were part of and how it was resolved." },
  { id: "b14", category: "behavioral", text: "Tell me about a time you had to give someone difficult feedback." },
  { id: "b15", category: "behavioral", text: "Describe a project that didn't go as planned. What would you do differently?" },

  // General
  { id: "g1", category: "general", text: "Tell me about yourself." },
  { id: "g2", category: "general", text: "Why do you want to work here?" },
  { id: "g3", category: "general", text: "What are your greatest strengths?" },
  { id: "g4", category: "general", text: "What is your biggest weakness?" },
  { id: "g5", category: "general", text: "Where do you see yourself in five years?" },
  { id: "g6", category: "general", text: "Why are you leaving your current job?" },
  { id: "g7", category: "general", text: "What motivates you at work?" },
  { id: "g8", category: "general", text: "How do you handle stress and pressure?" },
  { id: "g9", category: "general", text: "What are you looking for in your next role?" },
  { id: "g10", category: "general", text: "Why should we hire you?" },
  { id: "g11", category: "general", text: "What does success look like to you?" },
  { id: "g12", category: "general", text: "How would your former manager describe you?" },
  { id: "g13", category: "general", text: "What do you know about our company?" },
  { id: "g14", category: "general", text: "Do you have any questions for us?" },

  // Technical-general
  { id: "t1", category: "technical-general", text: "Walk me through how you'd approach solving a problem you've never seen before." },
  { id: "t2", category: "technical-general", text: "Describe a technical decision you made and how you evaluated the trade-offs." },
  { id: "t3", category: "technical-general", text: "Tell me about a time you had to debug a particularly difficult issue." },
  { id: "t4", category: "technical-general", text: "How do you stay current with changes in your field?" },
  { id: "t5", category: "technical-general", text: "Describe how you'd explain a complex technical concept to a non-technical stakeholder." },
  { id: "t6", category: "technical-general", text: "Tell me about a time you had to balance speed versus quality on a project." },
  { id: "t7", category: "technical-general", text: "How do you approach code review or reviewing others' work?" },
  { id: "t8", category: "technical-general", text: "Describe your process for planning and estimating a piece of work." },
  { id: "t9", category: "technical-general", text: "Tell me about a time you had to make a decision with incomplete information." },

  // Curveball
  { id: "c1", category: "curveball", text: "If you were an animal, which would you be and why?" },
  { id: "c2", category: "curveball", text: "How many windows are there in New York City?" },
  { id: "c3", category: "curveball", text: "What would you do if you won the lottery tomorrow?" },
  { id: "c4", category: "curveball", text: "Sell me this pen." },
  { id: "c5", category: "curveball", text: "If you could have dinner with anyone, living or dead, who would it be?" },
  { id: "c6", category: "curveball", text: "What's a belief you hold that most people disagree with?" },
  { id: "c7", category: "curveball", text: "Describe your job to a five-year-old." },
];
