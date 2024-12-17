export const getMockAnalytics = (timeRange) => {
  return {
    status: 'success',
    totalConversations: 150,
    todayMessages: 45,
    uniqueUsers: 78,
    avgResponseTime: 2.5,
    messagesByBot: {
      'Gendarme': 25,
      'Pompier': 30,
      'Citoyen 1': 15,
      'Citoyen 2': 20,
      'Citoyen 3': 10
    },
    activityByHour: Array.from({length: 24}, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 20)
    })),
    recentConversations: Array.from({length: 10}, (_, i) => ({
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      sender: `User${i}`,
      message: `Message de test ${i}`,
      responseTime: Math.random() * 5,
      assistant: ['Gendarme', 'Pompier', 'Citoyen 1', 'Citoyen 2', 'Citoyen 3'][Math.floor(Math.random() * 5)]
    })),
    timestamp: new Date().toISOString()
  };
};
