import fetch from 'node-fetch';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function createThread() {
  const response = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
  });
  const threadData = await response.json();
  return threadData.id;
}

async function addMessage(threadId, message) {
  await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      role: 'user',
      content: message,
    }),
  });
}

async function runAssistant(threadId, assistantId) {
  const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      assistant_id: assistantId, // Utiliser l'ID de l'assistant dynamique
    }),
  });
  const runData = await runResponse.json();
  return runData.id;
}

async function checkRunStatus(threadId, runId) {
  const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });
  return await runResponse.json();
}

async function getMessages(threadId) {
  const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });
  const messageData = await messageResponse.json();
  return messageData.data.filter(message => message.role === "assistant");
}

export async function handler(event, context) {
  const {
    userMessage,
    thread_id,
    assistant_id // Récupérer l'ID de l'assistant du front-end
  } = JSON.parse(event.body);

  try {
    let threadId = thread_id;

    if (!threadId) {
      threadId = await createThread();
    }

    await addMessage(threadId, userMessage);

    const runId = await runAssistant(threadId, assistant_id); // Passer l'ID de l'assistant

    let runStatus;
    do {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      runStatus = await checkRunStatus(threadId, runId);
    } while (runStatus.status !== 'completed' && runStatus.status !== 'failed');

    if (runStatus.status === 'completed') {
      const assistantMessages = await getMessages(threadId);
      const botResponse = assistantMessages.length > 0 ? assistantMessages[0].content[0].text.value : "Aucune réponse disponible.";

      return {
        statusCode: 200,
        body: JSON.stringify({
          botResponse,
          threadId
        }),
      };
    } else {
      throw new Error('Le run a échoué.');
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erreur interne du serveur',
        details: error.message,
      }),
    };
  }
}