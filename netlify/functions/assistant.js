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

export const handler = async (event, context) => {
  console.log('[assistant] Début du handler');
  console.log('[assistant] OPENAI_API_KEY définie:', !!OPENAI_API_KEY);
  
  try {
    const {
      userMessage,
      thread_id,
      assistant_id
    } = JSON.parse(event.body);

    console.log('[assistant] Message utilisateur:', userMessage);
    console.log('[assistant] Thread ID:', thread_id);
    console.log('[assistant] Assistant ID:', assistant_id);

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY non définie dans les variables d\'environnement');
    }

    let threadId = thread_id;

    if (!threadId) {
      console.log('[assistant] Création d\'un nouveau thread...');
      threadId = await createThread();
      console.log('[assistant] Thread créé:', threadId);
    }

    console.log('[assistant] Ajout du message au thread...');
    await addMessage(threadId, userMessage);

    console.log('[assistant] Lancement de l\'assistant...');
    const runId = await runAssistant(threadId, assistant_id);
    console.log('[assistant] Run ID:', runId);

    let runStatus;
    let attempts = 0;
    const maxAttempts = 30; // 30 * 3s = 90s max
    
    do {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      runStatus = await checkRunStatus(threadId, runId);
      attempts++;
      console.log(`[assistant] Status du run (tentative ${attempts}):`, runStatus.status);
      
      if (attempts >= maxAttempts) {
        throw new Error('Timeout: le run n\'a pas terminé après 90 secondes');
      }
    } while (runStatus.status !== 'completed' && runStatus.status !== 'failed');

    if (runStatus.status === 'completed') {
      console.log('[assistant] Run complété avec succès');
      const assistantMessages = await getMessages(threadId);
      console.log('[assistant] Nombre de messages reçus:', assistantMessages.length);
      
      const botResponse = assistantMessages.length > 0 ? assistantMessages[0].content[0].text.value : "Aucune réponse disponible.";

      return {
        statusCode: 200,
        body: JSON.stringify({
          botResponse,
          threadId
        }),
      };
    } else {
      console.error('[assistant] Le run a échoué. Status:', runStatus);
      console.error('[assistant] Détails du run:', JSON.stringify(runStatus));
      throw new Error(`Le run a échoué avec le status: ${runStatus.status}. Raison: ${runStatus.last_error?.message || 'Inconnue'}`);
    }
  } catch (error) {
    console.error('[assistant] Erreur complète:', error);
    console.error('[assistant] Stack trace:', error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erreur interne du serveur',
        details: error.message,
        stack: error.stack
      }),
    };
  }
}