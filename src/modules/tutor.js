"use strict";

const { ModuleError } = require("./errors");

function buildTutorContext(manager, moduleId, lessonId) {
  const opened = manager.open(moduleId);
  if (!opened.module || !opened.module.permissions || !opened.module.permissions.includes("tutor.context")) {
    throw new ModuleError("permission-denied", "Dieses Modul gibt keinen Lernkontext an den Hilfslehrer.");
  }
  const lesson = findLesson(opened.course, lessonId);
  return {
    enabled: false,
    provider: null,
    moduleId,
    subject: opened.module.subject || "",
    audience: opened.module.audience || "",
    lessonId: lesson ? lesson.id : "",
    title: lesson ? lesson.title : "",
    objectives: lesson ? lesson.objectives : [],
    conveyed: lesson ? lesson.blocks.map((block) => block.text || block.prompt).filter(Boolean) : [],
    policy: opened.course.tutorPolicy || { revealSolutions: false },
    progress: null,
    contract: [
      "Kein Provider wird aufgerufen.",
      "Lernstände werden nicht mitgeschickt.",
      "Lösungen werden nicht mitgeschickt."
    ]
  };
}

function findLesson(course, lessonId) {
  for (const section of course.sections || []) {
    for (const lesson of section.lessons || []) {
      if (!lessonId || lesson.id === lessonId) return lesson;
    }
  }
  return null;
}

module.exports = { buildTutorContext };
