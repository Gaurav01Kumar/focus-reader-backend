import { Request, Response } from 'express';
import { log } from '../utils/logger';
import { errorResponse, successResponse } from '../utils/response';
import { getAuth } from '@clerk/express';

export const aiTutor = async (req: Request, res: Response): Promise<any> => {
    try {
        log("AI Tutor request received.");

        const { userId } = getAuth(req);

        if (!userId) {
            log("Unauthorized access attempt.");
            return errorResponse(res, "Unauthorized access", 401);
        }
        
        log(`Request from user ID: ${userId}`);

        const { user_input ,type} = req.body;
        if (!user_input) {
            log("No user input provided.");
            return errorResponse(res, "User input is required", 400);
        }
        log(`User input: ${user_input}`);

      

       
           let promptPrefix = "";
    if (type === 'summarize') {
      promptPrefix = "Summarize the following text from a book in simple terms: ";
    } else if (type === 'examples') {
      promptPrefix = "Give real-world examples related to this concept from the book: ";
    } else if (type === 'explain') {
      promptPrefix = "Explain this concept or paragraph from a book in simple terms: ";
    } else {
      promptPrefix = "Help the student understand the following text from a book: ";
    }
   const prompt = `
You are an expert AI Tutor. ${promptPrefix} "${user_input}".

Guidelines:
- Be friendly, patient, and highly knowledgeable.
- Explain complex concepts using simple analogies and step-by-step reasoning.
- Encourage the student and always ask a follow-up question to check their understanding.
- Answer concisely and use only the essential context needed; avoid long, unnecessary explanations.
`;

        log("Prompt constructed, sending request to OpenRouter API...");

        const response = await fetch(`${process.env.OPENROUTER_API}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENROUTE_API_KEY}`
            },
            body: JSON.stringify({
                model: `${process.env.AI_TUTOR_MODEL}`,
                stream: true,
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok || !response.body) {
            log(`OpenRouter API request failed with status ${response.status}`);
            const error = await response.json();
            console.log(error);
            return errorResponse(res, "AI Tutor is unavailable now", error, 500);
        }

        log("OpenRouter API response received, streaming to client...");

        // Set SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    log("Finished streaming AI response to client.");
                    break;
                }

                // Append decoded chunk to buffer (stream:true preserves multi-byte chars)
                buffer += decoder.decode(value, { stream: true });

                // Process every complete line in the buffer
                while (true) {
                    const lineEnd = buffer.indexOf("\n");
                    if (lineEnd === -1) break;

                    const line = buffer.slice(0, lineEnd).trim();
                    buffer = buffer.slice(lineEnd + 1);

                    if (!line.startsWith("data: ")) continue;

                    const data = line.slice(6); // strip "data: "

                    if (data === "[DONE]") {
                        log("Received [DONE] signal from OpenRouter.");
                        res.write("data: [DONE]\n\n");
                        res.end();
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;

                        if (content) {
                            // Forward as a proper SSE event to the client
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        // Silently skip malformed JSON chunks (common in SSE streams)
                        continue;
                    }
                }
            }
        } finally {
            reader.cancel();
        }

        res.end();

    } catch (error: any) {
        console.log(error);
        log("AI Tutor is unavailable: " + error.message);

        // If headers already sent (streaming started), we can't send errorResponse
        if (!res.headersSent) {
            return errorResponse(res, "AI Tutor is unavailable now", 500, error.message);
        }

        // Gracefully close the stream with an error event
        res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
        res.end();
    }
};
export const generateQuiz = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return errorResponse(res, "Unauthorized", 401);

        const { text } = req.body;
        if (!text) return errorResponse(res, "Text is required", 400);

       const prompt = `
Generate a 3-question multiple choice quiz based on the following text.
Each question must have 4 options and one correct answer.
Return ONLY a JSON array of objects with this structure:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": number (0-3),
    "explanation": "string"
  }
]

Guidelines:
- Use only the essential context from the text; avoid unnecessary details.
- Questions should be clear, concise, and directly test understanding of the key points.
- Explanations should be short, informative, and helpful.

Text: ${text}
`;

        const response = await fetch(`${process.env.OPENROUTER_API}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENROUTE_API_KEY}`
            },
            body: JSON.stringify({
                model: `${process.env.AI_TUTOR_MODEL}`,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`AI API failed with status ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;
        
        try {
            const quizData = JSON.parse(content);
            return successResponse(res,"Ai Question Generated Successfully", quizData);
        } catch (parseError) {
            return errorResponse(res, "Failed to parse quiz data", 500);
        }
    } catch (error: any) {
        log("Quiz generation error", error.message);
        return errorResponse(res, "Server Error", 500, error.message);
    }
};