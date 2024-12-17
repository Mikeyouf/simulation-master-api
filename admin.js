// Importation des dépendances (si nécessaire)

class DashboardAdmin {
    constructor() {
        this.data = null;
        this.currentPage = 1;
        this.messagesPerPage = 30;
        this.botColors = {
            'Spacial': '#1E88E5',       // bleu
            'Cartographie et logiciel': '#00E676',  // vert
            'Gestion de crise': '#FFA726',  // orange
            'Multitâches': '#EF5350',   // rouge
            'Science humaine': '#7E57C2', // violet
            'Météo': '#00BCD4'          // cyan
        };
        this.charts = {
            messagesByBot: null,
            activityByHour: null,
            conversationLength: null
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            this.initializeElements();
            this.initializeCharts();
            this.setupEventListeners();
            await this.fetchData();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.showError('Erreur lors de l\'initialisation du dashboard');
        }
    }

    initializeElements() {
        this.refreshButton = document.getElementById('refreshBtn');
        this.botChartCanvas = document.getElementById('messagesByBot');
        this.activityChartCanvas = document.getElementById('activityByHour');
        this.conversationLengthCanvas = document.getElementById('conversationLengthChart');
        this.totalConversationsElement = document.getElementById('totalConversations');
        this.todayMessagesElement = document.getElementById('todayMessages');
        this.uniqueUsersElement = document.getElementById('uniqueUsers');
        this.conversationDistributionElement = document.getElementById('conversationDistribution');
        this.messagesTableBody = document.getElementById('messagesTableBody');
        this.averageResponseTimeElement = document.getElementById('averageResponseTime');
        this.prevPageButton = document.getElementById('prevPage');
        this.nextPageButton = document.getElementById('nextPage');
        this.currentPageElement = document.getElementById('currentPage');
        this.totalPagesElement = document.getElementById('totalPages');
    }

    setupEventListeners() {
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', () => this.fetchData());
        }
        
        if (this.prevPageButton) {
            this.prevPageButton.addEventListener('click', () => {
                if (this.currentPage > 1 && this.data && this.data.recentConversations) {
                    this.currentPage--;
                    this.updateTable(this.data.recentConversations);
                }
            });
        }
        
        if (this.nextPageButton) {
            this.nextPageButton.addEventListener('click', () => {
                if (!this.data || !this.data.recentConversations) return;
                
                const maxPage = Math.ceil(this.data.recentConversations.length / this.messagesPerPage);
                if (this.currentPage < maxPage) {
                    this.currentPage++;
                    this.updateTable(this.data.recentConversations);
                }
            });
        }
    }

    initializeCharts() {
        if (this.botChartCanvas) {
            this.charts.messagesByBot = new ApexCharts(this.botChartCanvas, {
                chart: {
                    type: 'donut',
                    height: 350,
                    toolbar: {
                        show: false
                    }
                },
                legend: {
                    position: 'bottom'
                },
                series: [0],
                labels: ['Chargement...'],
                dataLabels: {
                    enabled: true
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '70%'
                        }
                    }
                }
            });
            this.charts.messagesByBot.render();
        }

        if (this.activityChartCanvas) {
            this.charts.activityByHour = new ApexCharts(this.activityChartCanvas, {
                chart: {
                    type: 'bar',
                    height: 350,
                    toolbar: {
                        show: false
                    }
                },
                plotOptions: {
                    bar: {
                        horizontal: false,
                        columnWidth: '55%',
                        endingShape: 'rounded'
                    },
                },
                dataLabels: {
                    enabled: false
                },
                series: [{
                    name: 'Messages',
                    data: []
                }],
                xaxis: {
                    categories: Array.from({length: 24}, (_, i) => `${i}h`),
                    title: {
                        text: 'Heure'
                    }
                },
                yaxis: {
                    title: {
                        text: 'Nombre de messages'
                    },
                    min: 0
                }
            });
            this.charts.activityByHour.render();
        }

        if (this.conversationLengthCanvas) {
            this.charts.conversationLength = new ApexCharts(this.conversationLengthCanvas, {
                chart: {
                    type: 'bar',
                    height: 350,
                    toolbar: {
                        show: false
                    }
                },
                plotOptions: {
                    bar: {
                        horizontal: false,
                        columnWidth: '55%',
                        endingShape: 'rounded'
                    },
                },
                dataLabels: {
                    enabled: true
                },
                series: [{
                    name: 'Conversations',
                    data: []
                }],
                xaxis: {
                    categories: [],
                    title: {
                        text: 'Nombre de messages'
                    }
                },
                yaxis: {
                    title: {
                        text: 'Nombre de conversations'
                    },
                    min: 0
                }
            });
            this.charts.conversationLength.render();
        }
    }

    async fetchData() {
        try {
            console.log('Récupération des données');
            
            const response = await fetch('/.netlify/functions/get-analytics');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            console.log('Données reçues:', result);

            if (!result.data || !Array.isArray(result.data)) {
                throw new Error('Format de données invalide');
            }

            // Transformer les données reçues dans le format attendu
            const conversations = result.data.map(item => ({
                timestamp: item.Timestamp,
                conversationId: item['Conversation ID'],
                botType: item['Bot Type '] ? item['Bot Type '].trim() : '',
                userId: item['User ID'] || '',
                message: item['Message Content'] || '',
                sender: item['Sender '] ? item['Sender '].trim() : '',
                deviceInfo: item['Device Info'] || ''
            }));

            // Réinitialiser la page courante lors du rafraîchissement des données
            this.currentPage = 1;

            console.log('Premier message:', conversations[0]); // Pour déboguer

            // Calculer les statistiques
            const totalRows = conversations.length;
            const uniqueConversations = Math.floor(totalRows / 2); // Chaque conversation a 2 messages
            console.log('Nombre total de lignes:', totalRows);
            console.log('Nombre de conversations calculé:', uniqueConversations);

            const uniqueUsers = new Set(conversations.map(c => c.userId).filter(id => id)).size;
            
            // Calculer les messages d'aujourd'hui
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayMessages = conversations.filter(c => new Date(c.timestamp) >= today).length;

            // Calculer les messages par bot
            const messagesByBot = {};
            conversations.forEach(c => {
                const botType = c.botType.trim();
                if (botType) {
                    messagesByBot[botType] = (messagesByBot[botType] || 0) + 1;
                }
            });

            // Calculer l'activité par heure
            const activityByHour = Array(24).fill(0);
            conversations.forEach(c => {
                const hour = new Date(c.timestamp).getHours();
                activityByHour[hour]++;
            });

            // Calculer la distribution des longueurs de conversation
            const conversationLengths = {};
            const conversationsMap = new Map();
            
            conversations.forEach(msg => {
                if (!conversationsMap.has(msg.conversationId)) {
                    conversationsMap.set(msg.conversationId, []);
                }
                conversationsMap.get(msg.conversationId).push(msg);
            });
            
            conversationsMap.forEach(msgs => {
                const length = msgs.length;
                conversationLengths[length] = (conversationLengths[length] || 0) + 1;
            });
            
            // Calculer la moyenne des longueurs
            let totalLength = 0;
            let totalConvs = 0;
            Object.entries(conversationLengths).forEach(([length, count]) => {
                totalLength += Number(length) * count;
                totalConvs += count;
            });
            const avgLength = totalConvs > 0 ? Math.round(totalLength / totalConvs) : 0;
            
            console.log('Distribution des longueurs:', conversationLengths);
            console.log('Longueur moyenne:', avgLength, 'messages/conversation');

            // Calculer le temps de réponse moyen
            let totalResponseTime = 0;
            let responseCount = 0;
            
            for (let i = 0; i < conversations.length - 1; i++) {
                const currentMsg = conversations[i];
                const nextMsg = conversations[i + 1];
                
                // Si le message actuel est de l'utilisateur et le suivant du bot
                if (currentMsg.sender.toLowerCase().includes('user') && 
                    nextMsg.sender.toLowerCase().includes('bot') && 
                    currentMsg.conversationId === nextMsg.conversationId) {
                    
                    const userMsgTime = new Date(currentMsg.timestamp);
                    const botMsgTime = new Date(nextMsg.timestamp);
                    const responseTime = (botMsgTime - userMsgTime) / 1000; // Convertir en secondes
                    
                    if (responseTime >= 0 && responseTime < 300) { // Ignorer les temps de réponse > 5 minutes
                        totalResponseTime += responseTime;
                        responseCount++;
                    }
                }
            }
            
            const averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
            console.log('Temps de réponse moyen:', averageResponseTime, 'secondes');

            const data = {
                totalConversations: uniqueConversations,
                uniqueUsers,
                todayMessages,
                messagesByBot,
                activityByHour: activityByHour.map((count, hour) => ({
                    hour,
                    count
                })),
                conversationLengths,
                averageLength: avgLength,
                recentConversations: conversations,
                averageResponseTime
            };

            // Stocker les données
            this.data = data;

            // Mettre à jour l'interface
            this.updateTable(conversations);
            this.updateStats(data);
            this.updateBotChart(data.messagesByBot);
            this.updateActivityChart(data.activityByHour);
            this.updateConversationLengthChart(data.conversationLengths);
            this.updateConversationDistribution(data.averageLength);
            this.updateAverageResponseTime(data.averageResponseTime);

        } catch (error) {
            console.error('Erreur lors de la récupération des analytics:', error);
            this.showError('Erreur lors de la récupération des données');
        }
    }

    updateTable(conversations) {
        if (!this.messagesTableBody) return;
        
        this.messagesTableBody.innerHTML = '';
        
        if (!Array.isArray(conversations)) {
            console.error('Les conversations ne sont pas un tableau:', conversations);
            return;
        }
        
        // Calculer la pagination
        const startIndex = (this.currentPage - 1) * this.messagesPerPage;
        const endIndex = startIndex + this.messagesPerPage;
        const totalPages = Math.ceil(conversations.length / this.messagesPerPage);
        
        // Mettre à jour les éléments de pagination
        if (this.currentPageElement) {
            this.currentPageElement.textContent = this.currentPage;
        }
        if (this.totalPagesElement) {
            this.totalPagesElement.textContent = totalPages;
        }
        if (this.prevPageButton) {
            this.prevPageButton.disabled = this.currentPage === 1;
        }
        if (this.nextPageButton) {
            this.nextPageButton.disabled = this.currentPage === totalPages;
        }
        
        const fragment = document.createDocumentFragment();
        
        // Trier les conversations par date (plus récentes en premier)
        const sortedConversations = [...conversations].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        // Sélectionner seulement les conversations pour la page courante
        const pageConversations = sortedConversations.slice(startIndex, endIndex);
        
        pageConversations.forEach(conv => {
            try {
                const row = document.createElement('tr');
                const date = new Date(conv.timestamp);
                
                // Obtenir la couleur de fond en fonction du type de bot
                const botType = conv.botType.trim();
                const backgroundColor = this.botColors[botType] ? `${this.botColors[botType]}15` : 'transparent';
                
                row.style.backgroundColor = backgroundColor;
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${this.truncateText(conv.sender, 30)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${this.truncateText(botType || '-', 30)}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 message-cell">
                        ${this.truncateText(conv.message, 100)}
                    </td>
                `;
                
                fragment.appendChild(row);
            } catch (error) {
                console.error('Erreur lors de la création de la ligne:', error, conv);
            }
        });
        
        this.messagesTableBody.appendChild(fragment);
    }

    updateStats(data) {
        if (this.totalConversationsElement) {
            this.totalConversationsElement.textContent = data.totalConversations || '0';
        }
        if (this.todayMessagesElement) {
            this.todayMessagesElement.textContent = data.todayMessages || '0';
        }
        if (this.uniqueUsersElement) {
            this.uniqueUsersElement.textContent = data.uniqueUsers || '0';
        }
    }

    updateAverageResponseTime(averageResponseTime) {
        if (this.averageResponseTimeElement) {
            this.averageResponseTimeElement.textContent = averageResponseTime + ' secondes';
        }
    }

    updateBotChart(messagesByBot) {
        if (!this.charts.messagesByBot) return;

        const series = [];
        const labels = [];
        
        Object.entries(messagesByBot).forEach(([bot, count]) => {
            series.push(count);
            labels.push(bot);
        });

        this.charts.messagesByBot.updateOptions({
            labels: labels,
            colors: labels.map(label => this.botColors[label] || '#808080'),
            legend: {
                position: 'bottom'
            }
        });

        this.charts.messagesByBot.updateSeries(series);
    }

    updateActivityChart(activityByHour) {
        if (!this.charts.activityByHour) return;

        const data = activityByHour.map(h => h.count);
        
        this.charts.activityByHour.updateSeries([{
            name: 'Messages',
            data
        }]);
    }

    updateConversationLengthChart(conversationLengths) {
        if (!this.charts.conversationLength) return;
        
        const sortedData = Object.entries(conversationLengths)
            .sort(([a], [b]) => Number(a) - Number(b));
        
        const categories = sortedData.map(([length]) => `${length} messages`);
        const data = sortedData.map(([, count]) => count);
        
        this.charts.conversationLength.updateOptions({
            xaxis: {
                categories: categories
            }
        });
        
        this.charts.conversationLength.updateSeries([{
            name: 'Conversations',
            data: data
        }]);
    }
    
    updateConversationDistribution(averageLength) {
        if (this.conversationDistributionElement) {
            this.conversationDistributionElement.textContent = averageLength;
        }
    }

    truncateText(text, maxLength) {
        if (!text) return '-';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    showError(message) {
        console.error(message);
        // Implémenter l'affichage d'erreur si nécessaire
    }
}

// Exporter la classe et créer une instance
export const dashboardAdmin = new DashboardAdmin();
