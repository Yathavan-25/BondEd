import type { Request, Response } from 'express';
import { SessionModel } from "../models/sessionModel.js";

const getStringParam = (param: string | string[] | undefined): string | null => {
    if (Array.isArray(param)) return param[0] || null;
    return (param !== undefined && param !== "") ? param : null;
};

export const getSummaries = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = getStringParam(req.params.studentId);
        if (!studentId) { res.status(400).json({ error: "Student ID is missing" }); return; }
        const summaries = await SessionModel.getUserSummaries(studentId);
        res.json(summaries);
    } catch (error) {
        console.error("Failed to fetch summaries:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = getStringParam(req.params.studentId);
        if (!studentId) { res.status(400).json({ error: "Student ID is missing" }); return; }
        const analytics = await SessionModel.getUserAnalytics(studentId);
        res.json(analytics);
    } catch (error) {
        console.error("Failed to fetch analytics:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getLastSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = getStringParam(req.params.studentId);
        const topic = req.query.topic as string | undefined;
        if (!studentId) { res.status(400).json({ error: "Student ID is missing" }); return; }
        const lastSession = await SessionModel.getLastSessionSummary(studentId, topic);
        res.json({ lastSession });
    } catch (error) {
        console.error("Failed to fetch last summary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};