// Fonction pour vérifier l'état du run
async function checkRunStatus(threadId, runId) {
  const runStatusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });

  const runStatusData = await runStatusResponse.json();
  return runStatusData;
}

export async function handler(event, context) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ASSISTANT_ID = process.env.ASSISTANT_ID;
  const {
    userMessage,
    thread_id
  } = JSON.parse(event.body);

  try {
    let threadId = thread_id;

    // Créer un thread si aucun n'existe
    if (!threadId) {
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      const threadData = await threadResponse.json();
      threadId = threadData.id;
    }

    // Ajouter un message utilisateur au thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: userMessage,
      }),
    });

    // Exécuter le thread pour obtenir une réponse
    let runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
      }),
    });

    const runData = await runResponse.json();

    // Poll pour vérifier que le run est terminé
    let runStatus = runData.status;
    let runId = runData.id;
    let runStatusData;

    while (runStatus !== 'completed' && runStatus !== 'failed') {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Attente de 3 secondes
      runStatusData = await checkRunStatus(threadId, runId); // Appel de la fonction pour vérifier le statut
      runStatus = runStatusData.status;
    }

    // Récupérer les messages
    if (runStatus === 'completed') {
      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      const messageData = await messageResponse.json();
      const botResponse = messageData.data.reverse().find(message => message.role === "assistant").content[0].text.value;

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
    console.error('Erreur lors de l\'interaction avec l\'assistant:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erreur interne du serveur',
        details: error.message
      }),
    };
  }
}