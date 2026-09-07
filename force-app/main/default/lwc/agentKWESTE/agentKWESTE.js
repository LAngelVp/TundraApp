import { LightningElement } from 'lwc';
import AGENT_ICON_CHAT from '@salesforce/resourceUrl/agentKWESTE_iconTractoIA';

export default class AgentKWESTE extends LightningElement {
    AGENT_ICON_CHAT = AGENT_ICON_CHAT;
    isOpen = false;
    isLoading = false;
    inputMessage = '';
    messages = [];
    messageId = 0;
    sessionId = '';
    sessionIdLabel = '';

    // Configuración del endpoint de N8N
    N8N_WEBHOOK_URL = 'https://n8n.kenworthdafdeleste.com/webhook/chat';

    connectedCallback() {
        this.sessionId = this.getSessionId();
        this.sessionIdLabel = this.getSessionLabel(this.sessionId);
        this.logMessage('Componente Chat inicializado con sesión ' + this.sessionId);
        this.unloadHandler = () => this.markUnloadTimestamp();
        window.addEventListener('beforeunload', this.unloadHandler);
    }

    disconnectedCallback() {
        window.removeEventListener('beforeunload', this.unloadHandler);
    }

    /**
     * Alterna la visibilidad de la ventana del chat
     */
    handleToggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            // Scroll a los mensajes más recientes cuando se abre
            this.scrollToBottom();
        }
    }

    /**
     * Maneja cambios en el input de mensajes
     */
    handleInputChange(event) {
        this.inputMessage = event.target.value;
    }

    /**
     * Maneja la tecla Enter para enviar mensajes
     */
    handleKeyPress(event) {
        if (event.key === 'Enter' && !this.isLoading) {
            this.handleSendMessage();
        }
    }

    /**
     * Envía el mensaje al agente N8N
     */
    async handleSendMessage() {
        const message = this.inputMessage.trim();
        
        if (!message) {
            return;
        }

        // Agregar mensaje del usuario
        this.addMessage(message, true);
        this.inputMessage = '';
        this.isLoading = true;

        try {
            // Enviar mensaje al webhook de N8N
            const response = await this.sendToN8N(message);
            
            // Agregar respuesta del agente
            this.addMessage(response, false);
        } catch (error) {
            this.logError('Error al enviar mensaje:', error);
            this.addMessage(
                'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
                false
            );
        } finally {
            this.isLoading = false;
            this.scrollToBottom();
        }
    }

    /**
     * Envía el mensaje al webhook de N8N
     */
    async sendToN8N(message) {
        try {
            const response = await fetch(this.N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    body: message,
                    timestamp: new Date().toISOString(),
                    sessionID: this.getSessionId()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response || data.message || 'Respuesta recibida';
        } catch (error) {
            this.logError('Error en comunicación con N8N:', error);
            throw error;
        }
    }

    /**
     * Agrega un mensaje a la lista
     */
    addMessage(text, isUser) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const message = {
            id: `msg-${this.messageId++}`,
            text: text,
            isUser: isUser,
            className: isUser ? 'message-wrapper user' : 'message-wrapper agent',
            timestamp: timeString,
            html: ''
        };

        if (isUser) {
            // Mostrar el mensaje del usuario alineado a la derecha
            message.html = this.escapeHtml(text).replace(/\n/g, '<br>');
        } else {
            // El agente puede enviar Markdown/HTML/Gráficos: convertir utilizando la función genérica optimizada
            message.html = this.markdownToHtml(text);
        }

        this.messages = [...this.messages, message];
    }

    /**
     * Escapa HTML para evitar inyecciones de scripts maliciosos
     */
    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Función Genérica Inteligente: Formatea respuestas en Markdown, HTML, Tablas e Imágenes/Gráficos.
     * Diseñada para romper el aislamiento del Shadow DOM e inyectar estilos persistentes en LWC.
     */
    markdownToHtml(md) {
    if (!md) return '';
    let html = md;

    // ==========================================
    // 1. EXTRACTOR MULTI-GRÁFICAS Y AUTO-REPARABLE (OPTIMIZADO)
    // ==========================================
    // Cambiado a un enfoque que tolera si la URL se corta al final de todo el documento ($)
    const quickChartRegex = /(?:!?\[([^\]]*)\]\()?https:\/\/quickchart\.io\/chart\?c=([A-Za-z0-9%_\-\.\!\~\*\'\(\)\,]+|$)/gi;
    
    html = html.replace(quickChartRegex, (match, altName, urlConfig) => {
        // Si el match es solo la URL base sin configuración, evitar romper
        if (!urlConfig && !match.includes('?c=')) return match;
        
        try {
            let alt = altName || 'Gráfico de Ventas';
            let cleanConfig = urlConfig.replace(/[\r\n\s]+/g, '').trim();
            
            // Limpiar residuos comunes de corte si quedó algún paréntesis colgando
            if (cleanConfig.endsWith(')')) {
                cleanConfig = cleanConfig.slice(0, -1);
            }
            cleanConfig = cleanConfig.replace(/^["']|["']$/g, '');
            
            // Contar y balancear estructuras codificadas en URL
            const openBraces = (cleanConfig.match(/%7B/gi) || []).length;
            const closeBraces = (cleanConfig.match(/%7D/gi) || []).length;
            const openBrackets = (cleanConfig.match(/%5B/gi) || []).length;
            const closeBrackets = (cleanConfig.match(/%5D/gi) || []).length;
            
            // Si falta cerrar el JSON por un corte abrupto de la IA, lo reparamos inyectando los cierres
            if (openBrackets > closeBrackets) {
                cleanConfig += '%5D'.repeat(openBrackets - closeBrackets);
            }
            if (openBraces > closeBraces) {
                // Si se cortó a mitad de una clave/valor, nos aseguramos de cerrar las comillas pendientes primero
                const quoteCount = (cleanConfig.match(/%22/gi) || []).length;
                if (quoteCount % 2 !== 0) {
                    cleanConfig += '%22'; 
                }
                cleanConfig += '%7D'.repeat(openBraces - closeBraces);
            }

            const finalUrl = `https://quickchart.io/chart?c=${cleanConfig}`;

            return `\n===CHART_START===\n<div class="chat-chart-container" style="margin: 20px 0; text-align: center; background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #d8dee4; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; max-width: 100%;">\n<img src="${finalUrl}" alt="${alt}" loading="lazy" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />\n</div>\n===CHART_END===\n`;
        } catch (e) {
            console.error('Error al procesar renderizado de gráfica:', e);
            return ''; 
        }
    });

    // Limpieza agresiva de caracteres basura que la IA deja huérfanos tras el corte
    html = html.replace(/^[ \t]*\)?%22%7D%7D%7D\)?/gm, '');
    html = html.replace(/^[ \t]*\)/gm, '');
    html = html.replace(/^[\s\r\n]*%22%7D%7D%7D\)?/gm, '');
    html = html.replace(/%22%7D%7D%7D\)?$/gm, ''); // Limpieza al final de línea absoluta

    // ==========================================
    // 2. BLOQUES DE CÓDIGO (Marcado Temporal)
    // ==========================================
    const codeBlocks = [];
    html = html.replace(/```([\s\S]*?)```/g, (m, code) => {
        const id = `===CODE_BLOCK_${codeBlocks.length}===`;
        const escapedCode = this.escapeHtml(code.trim());
        codeBlocks.push(`<pre style="background: #f4f6f9; padding: 8px; border-radius: 4px; overflow-x: auto; margin-bottom: 10px;"><code>${escapedCode}</code></pre>`);
        return `\n${id}\n`;
    });

    // ==========================================
    // 3. PROCESAMIENTO DE ENCABEZADOS (HEADERS MD)
    // ==========================================
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
               .replace(/^## (.*$)/gim, '<h2>$1</h2>')
               .replace(/^# (.*$)/gim, '<h1>$1</h1>')
               .replace(/^---$/gim, '<hr style="border: 0; border-top: 1px solid #d8dee4; margin: 20px 0;" />');

    // ==========================================
    // 4. PROCESAMIENTO DE TABLAS LÍNEA POR LÍNEA
    // ==========================================
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const outLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (/^\s*\|.*\|\s*$/.test(line)) {
            const cols = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
            
            if (cols.every(c => /^:-*-*:*$/.test(c) || /^-+$/.test(c))) {
                continue;
            }

            if (!inTable) {
                inTable = true;
                tableHtml = '<table class="md-table" style="width:100%; border-collapse: collapse; margin: 10px 0; font-size: 0.9rem;"><tbody>';
            }
            
            const processedCols = cols.map(c => {
                let cellText = this.escapeHtml(c);
                cellText = cellText
                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                    .replace(/`([^`]+)`/g, '<code style="background: #f4f6f9; padding: 2px 4px; border-radius: 3px;">$1</code>');
                
                return '<td style="border: 1px solid #d8dee4; padding: 6px 10px; min-width: 50px;">' + cellText + '</td>';
            }).join('');

            tableHtml += '<tr>' + processedCols + '</tr>';
        } else {
            if (inTable) {
                inTable = false;
                tableHtml += '</tbody></table>';
                outLines.push(tableHtml);
                tableHtml = '';
            }
            outLines.push(line);
        }
    }
    
    if (inTable) {
        tableHtml += '</tbody></table>';
        outLines.push(tableHtml);
    }

    // ==========================================
    // 5. AGRUPACIÓN DE PÁRRAFOS Y ELEMENTOS
    // ==========================================
    let finalHtml = '';
    let currentParagraph = [];
    let insideChart = false;

    for (let i = 0; i < outLines.length; i++) {
        const line = outLines[i].trim();
        
        if (!line) {
            if (currentParagraph.length > 0) {
                finalHtml += '<p style="margin-bottom: 8px;">' + currentParagraph.join('<br>') + '</p>';
                currentParagraph = [];
            }
            continue;
        }

        if (line === '===CHART_START===') {
            if (currentParagraph.length > 0) {
                finalHtml += '<p style="margin-bottom: 8px;">' + currentParagraph.join('<br>') + '</p>';
                currentParagraph = [];
            }
            insideChart = true;
            continue;
        }
        if (line === '===CHART_END===') {
            insideChart = false;
            continue;
        }

        // Evitamos meter etiquetas HTML estructurales dentro de etiquetas <p>
        if (line.startsWith('===CODE_BLOCK_') || line.startsWith('<table') || line.startsWith('<h') || line.startsWith('<hr') || insideChart) {
            if (currentParagraph.length > 0) {
                finalHtml += '<p style="margin-bottom: 8px;">' + currentParagraph.join('<br>') + '</p>';
                currentParagraph = [];
            }
            finalHtml += line;
        } else {
            currentParagraph.push(line);
        }
    }
    
    if (currentParagraph.length > 0) {
        finalHtml += '<p style="margin-bottom: 8px;">' + currentParagraph.join('<br>') + '</p>';
    }

    // ==========================================
    // 6. RESTAURACIÓN Y FORMATEO INLINE FINAL
    // ==========================================
    codeBlocks.forEach((block, index) => {
        finalHtml = finalHtml.replace(`===CODE_BLOCK_${index}===`, block);
    });

    finalHtml = finalHtml
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background: #f4f6f9; padding: 2px 4px; border-radius: 3px;">$1</code>');

    if (typeof this.cleanStylesInline === 'function') {
        finalHtml = this.cleanStylesInline(finalHtml);
    }

    return finalHtml;
}

    /**
     * Normaliza e inyecta propiedades CSS inline a negritas, itálicas y enlaces.
     * Previene que Salesforce barra o remueva el peso tipográfico nativo de las fuentes.
     */
    cleanStylesInline(text) {
        if (!text) return '';
        let clean = text;

        // ENLACES HIPERTEXTO (Markdown y HTML)
        clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #0176d3; text-decoration: underline;">$1</a>');
        clean = clean.replace(/&lt;a href="([^"]+)"&gt;([\s\S]*?)&lt;\/a&gt;/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #0176d3; text-decoration: underline;">$2</a>');

        // NEGRITAS (Soporte total: **, <strong> crudo y &lt;strong&gt; sanitizado)
        const boldInlineStyle = '<strong style="font-weight: bold !important; color: inherit;">$1</strong>';
        clean = clean.replace(/\*\*(.+?)\*\*/g, boldInlineStyle);
        clean = clean.replace(/&lt;strong&gt;([\s\S]*?)&lt;\/strong&gt;/g, boldInlineStyle);
        clean = clean.replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/g, boldInlineStyle);
        clean = clean.replace(/<strong>([\s\S]*?)<\/strong>/g, boldInlineStyle);
        clean = clean.replace(/<b>([\s\S]*?)<\/b>/g, boldInlineStyle);

        // ITÁLICAS (Soporte total: *, <em> crudo y &lt;em&gt; sanitizado)
        const italicInlineStyle = '<em style="font-style: italic;">$1</em>';
        clean = clean.replace(/\*([^*]+)\*/g, italicInlineStyle);
        clean = clean.replace(/&lt;em&gt;([\s\S]*?)&lt;\/em&gt;/g, italicInlineStyle);
        clean = clean.replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/g, italicInlineStyle);
        clean = clean.replace(/<em>([\s\S]*?)<\/em>/g, italicInlineStyle);
        clean = clean.replace(/<i>([\s\S]*?)<\/i>/g, italicInlineStyle);

        return clean;
    }

    /**
     * Scroll automático al último mensaje
     */
    scrollToBottom() {
        setTimeout(() => {
            const container = this.template.querySelector('.chat-messages');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 0);
    }

    /**
     * Obtiene o genera un ID de sesión para el usuario
     */
    getSessionId() {
        const localId = localStorage.getItem('chatSessionId');
        const lastUnload = Number(localStorage.getItem('chatSessionLastUnload') || '0');
        const now = Date.now();

        let sessionId = sessionStorage.getItem('chatSessionId');

        if (!sessionId && localId) {
            const recentReload = now - lastUnload <= 10000;
            if (recentReload) {
                sessionId = localId;
            }
        }

        if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }

        sessionStorage.setItem('chatSessionId', sessionId);
        localStorage.setItem('chatSessionId', sessionId);
        localStorage.removeItem('chatSessionLastUnload');
        return sessionId;
    }

    markUnloadTimestamp() {
        localStorage.setItem('chatSessionLastUnload', Date.now().toString());
    }

    getSessionLabel(sessionId) {
        if (!sessionId) {
            return '';
        }
        const prefix = sessionId.slice(0, 8);
        const suffix = sessionId.slice(-4);
        return `${prefix}...${suffix}`;
    }

    /**
     * Método de utilidad para logging
     */
    logMessage(message) {
        console.log('[AgentKWESTE]', message);
    }

    /**
     * Método de utilidad para logging de errores
     */
    logError(message, error) {
        console.error('[AgentKWESTE]', message, error);
    }
}