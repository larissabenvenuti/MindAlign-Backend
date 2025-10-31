import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get(
  "/api/tasks",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const tasks = await prisma.task.findMany({
        where: { userId },
        orderBy: { id: "desc" },
      });
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Erro ao buscar tarefas" });
    }
  }
);

router.post(
  "/api/tasks",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { text } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Texto da tarefa obrigatório" });
      }
      const task = await prisma.task.create({
        data: {
          text: text.trim().slice(0, 80),
          userId,
        },
      });
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Erro ao criar tarefa" });
    }
  }
);

router.patch(
  "/api/tasks/:id/toggle",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const task = await prisma.task.findFirst({ where: { id, userId } });
      if (!task)
        return res.status(404).json({ error: "Tarefa não encontrada" });
      const updated = await prisma.task.update({
        where: { id },
        data: { completed: !task.completed },
      });
      res.json(updated);
    } catch (error) {
      console.error("Error toggling task:", error);
      res.status(500).json({ error: "Erro ao atualizar tarefa" });
    }
  }
);

router.delete(
  "/api/tasks/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const task = await prisma.task.findFirst({ where: { id, userId } });
      if (!task)
        return res.status(404).json({ error: "Tarefa não encontrada" });
      await prisma.task.delete({ where: { id } });
      res.json({ message: "Tarefa excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Erro ao excluir tarefa" });
    }
  }
);

export default router;
