// netlify/functions/assistant.js

import fetch from 'node-fetch';

exports.handler = async function (event, context) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Stockée en toute sécurité sur Netlify
  const ASSISTANT_ID = process.env.ASSISTANT_ID; // Stocké en toute sécurité sur Netlify

  const {
    userMessage
  } = JSON.parse(event.body);

  try {
    // Appel à l'API OpenAI en utilisant l'ID de l'assistant
    const response = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: userMessage,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: error.message
        }),
      };
    }

    const data = await response.json();
    const botResponse = data.output; // Ajustez en fonction de la réponse réelle de l'API

    return {
      statusCode: 200,
      body: JSON.stringify({
        botResponse
      }),
    };
  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'assistant:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erreur interne du serveur'
      }),
    };
  }
}