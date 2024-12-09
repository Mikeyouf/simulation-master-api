class DashboardManager {
    constructor() {
        this.timeRange = '24h';
        this.charts = {};
        this.data = null;
        this.setupEventListeners();
        this.initializeCharts();
        this.fetchData();
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => this.fetchData());
        document.getElementById('timeRange').addEventListener('change', (e) => {
            this.timeRange = e.target.value;
            this.fetchData();
        });
    }

    async fetchData() {
        try {
            const response = await fetch(`/.netlify/functions/get-analytics?timeRange=${this.timeRange}`);
            if (!response.ok) throw new Error('Erreur lors de la récupération des données');
            this.data = await response.json();
            this.updateDashboard();
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    updateDashboard() {
        this.updateStats();
        this.updateCharts();
        this.updateTable();
    }

    updateStats() {
        if (!this.data) return;

        document.getElementById('totalConversations').textContent = this.data.totalConversations;
        document.getElementById('todayMessages').textContent = this.data.todayMessages;
        document.getElementById('avgResponseTime').textContent = (this.data.avgResponseTime / 1000).toFixed(2);
        document.getElementById('uniqueUsers').textContent = this.data.uniqueUsers;
    }

    initializeCharts() {
        // Configuration du graphique des messages par bot
        const messagesByBotOptions = {
            series: [],
            chart: {
                type: 'donut',
                height: 300
            },
            labels: [],
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        };

        // Configuration du graphique d'activité par heure
        const activityByHourOptions = {
            series: [{
                name: 'Messages',
                data: []
            }],
            chart: {
                height: 300,
                type: 'area'
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            xaxis: {
                type: 'category',
                categories: []
            },
            tooltip: {
                x: {
                    format: 'HH:mm'
                }
            }
        };

        this.charts.messagesByBot = new ApexCharts(document.querySelector("#messagesByBot"), messagesByBotOptions);
        this.charts.activityByHour = new ApexCharts(document.querySelector("#activityByHour"), activityByHourOptions);

        this.charts.messagesByBot.render();
        this.charts.activityByHour.render();
    }

    updateCharts() {
        if (!this.data) return;

        // Mise à jour du graphique des messages par bot
        this.charts.messagesByBot.updateOptions({
            series: Object.values(this.data.messagesByBot),
            labels: Object.keys(this.data.messagesByBot)
        });

        // Mise à jour du graphique d'activité par heure
        this.charts.activityByHour.updateOptions({
            series: [{
                name: 'Messages',
                data: this.data.activityByHour.counts
            }],
            xaxis: {
                categories: this.data.activityByHour.hours
            }
        });
    }

    updateTable() {
        if (!this.data || !this.data.recentConversations) return;

        const tbody = document.querySelector('#conversationsTable tbody');
        tbody.innerHTML = '';

        this.data.recentConversations.forEach(conv => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${conv.conversationId.slice(0, 8)}...</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${conv.botType}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${this.truncateText(conv.message, 50)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(conv.responseTime / 1000).toFixed(2)}s</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(conv.timestamp).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }
}

// Initialiser le dashboard
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});
