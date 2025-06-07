document.addEventListener('DOMContentLoaded', () => {
    // Digital Rain Effect with Tech Symbols
    const canvas = document.getElementById('digital-rain');
    const ctx = canvas.getContext('2d');
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    const chars = '{}[]#0$&%><'; // Techy symbols for BugBlaster
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = [];
    let globalOpacity = 0;

    for (let x = 0; x < columns; x++) {
        drops[x] = Math.floor(Math.random() * (canvas.height / fontSize));
    }

    const fadeInDuration = 700;
    const fadeInSteps = 60;
    const opacityIncrement = 0.7 / fadeInSteps;
    let fadeInStep = 0;

    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (fadeInStep < fadeInSteps) {
            globalOpacity += opacityIncrement;
            fadeInStep++;
        }
        ctx.fillStyle = `rgba(0, 255, 0, ${globalOpacity})`; // Neon green
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(draw, 66);

    // Scroll Button Logic
    const scrollBtn = document.getElementById('scroll-btn');
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const scrollPercent = scrollPos / (docHeight - windowHeight) * 100;

        if (scrollPercent >= 20) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    window.addEventListener('resize', () => {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        const newColumns = Math.floor(canvas.width / fontSize);
        while (drops.length < newColumns) {
            drops.push(Math.floor(Math.random() * (canvas.height / fontSize)));
        }
        while (drops.length > newColumns) {
            drops.pop();
        }
    });

    // Animate sections on scroll
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        observer.observe(section);
    });

    // Chat Management for ai.html
    if (document.querySelector('.chat-layout')) {
        let chats = JSON.parse(localStorage.getItem('bugblaster_chats')) || [
            {
                id: 0,
                name: 'New Chat',
                messages: [
                    {
                        type: 'ai',
                        text: 'Hey, welcome to BugBlaster AI! I’m here to crush your tech glitches like cmd not opening or Wi-Fi dropping. Drop your issue, and let’s hack it!'
                    }
                ]
            }
        ];
        let currentChatId = chats.length ? chats[0].id : 0;

        function saveChats() {
            localStorage.setItem('bugblaster_chats', JSON.stringify(chats));
        }

        function renderChats() {
            const chatList = document.querySelector('.chat-list');
            chatList.innerHTML = '';
            chats.forEach(chat => {
                const chatItem = document.createElement('div');
                chatItem.className = `chat-item ${chat.id === currentChatId ? 'active-chat' : ''}`;
                chatItem.dataset.chatId = chat.id;
                chatItem.textContent = chat.name;
                chatItem.addEventListener('click', () => selectChat(chat.id));
                chatList.appendChild(chatItem);
            });
            renderMessages();
        }

        function renderMessages() {
            const chatBox = document.querySelector('.chat-box');
            chatBox.innerHTML = ''; // Clear once
            const currentChat = chats.find(chat => chat.id === currentChatId);
            if (currentChat) {
                currentChat.messages.forEach((message, index) => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${message.type}`;
                    messageDiv.dataset.messageId = `msg-${index}`;
                    let formattedText = message.text
                        .replace(/\\n/g, '\n') // Handle escaped \n
                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold **text**
                        .replace(/\*(.*?)\*/g, '<b>$1</b>') // Bold *text*
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/\n/g, '<br>');
                    messageDiv.innerHTML = `<p>${formattedText}</p>`;
                    chatBox.appendChild(messageDiv);
                });
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }

        function typeMessage(text, messageDiv, callback) {
            const chatBox = document.querySelector('.chat-box');
            text = text.replace(/\\n/g, '\n'); // Handle escaped \n
            const lines = text.split('\n');
            let lineIndex = 0;
            let charIndex = 0;

            function typeChar() {
                if (lineIndex < lines.length) {
                    if (charIndex < lines[lineIndex].length) {
                        let currentText = lines[lineIndex].slice(0, charIndex + 1);
                        let formattedText = lines.slice(0, lineIndex).join('<br>') + (lineIndex > 0 ? '<br>' : '') + currentText;
                        formattedText = formattedText
                            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold **text**
                            .replace(/\*(.*?)\*/g, '<b>$1</b>') // Bold *text*
                            .replace(/\n\n/g, '</p><p>')
                            .replace(/\n/g, '<br>');
                        messageDiv.innerHTML = `<p>${formattedText}</p>`;
                        chatBox.scrollTop = chatBox.scrollHeight;
                        charIndex++;
                        setTimeout(typeChar, 24);
                    } else {
                        lineIndex++;
                        charIndex = 0;
                        setTimeout(typeChar, 24);
                    }
                } else {
                    callback();
                }
            }
            typeChar();
        }

        window.newChat = function() {
            const newId = chats.length ? Math.max(...chats.map(c => c.id)) + 1 : 0;
            chats.push({
                id: newId,
                name: `Chat ${newId + 1}`,
                messages: [
                    {
                        type: 'ai',
                        text: 'Hey, welcome to BugBlaster AI! I’m here to crush your tech glitches like cmd not opening or Wi-Fi dropping. Drop your issue, and let’s hack it!'
                    }
                ]
            });
            currentChatId = newId;
            saveChats();
            renderChats();
        };

        window.renameChat = function() {
            const currentChat = chats.find(chat => chat.id === currentChatId);
            if (currentChat) {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentChat.name;
                input.className = 'rename-input';
                const chatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
                chatItem.innerHTML = '';
                chatItem.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    const newName = input.value.trim() || `Chat ${currentChatId + 1}`;
                    currentChat.name = newName;
                    saveChats();
                    renderChats();
                });
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        input.blur();
                    }
                });
            }
        };

        window.deleteChat = function() {
            if (chats.length <= 1) return;
            chats = chats.filter(chat => chat.id !== currentChatId);
            currentChatId = chats.length ? chats[0].id : null;
            if (!chats.length) {
                newChat();
            }
            saveChats();
            renderChats();
        };

        window.selectChat = function(id) {
            currentChatId = id;
            renderChats();
        };

        window.sendMessage = async function() {
            const input = document.getElementById('chat-input');
            const chatBox = document.querySelector('.chat-box');
            if (input.value.trim()) {
                const currentChat = chats.find(chat => chat.id === currentChatId);
                const userMessage = input.value;
                currentChat.messages.push({
                    type: 'user',
                    text: userMessage
                });
                input.value = '';
                renderMessages();
                saveChats();

                // Create AI message div for loading and response
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message ai loading-text';
                chatBox.appendChild(messageDiv);
                chatBox.scrollTop = chatBox.scrollHeight;

                try {
                    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCQoyIkkdIjCpcMCdTEsxI_yWVBA5Z1pxA', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: `You are BugBlaster AI, a tech troubleshooting expert with a bold, cyberpunk tone. Fix this issue: "${userMessage}". Use **bold** or *bold* for emphasis (e.g., **Step 1: Do this** or *Step 1: Do this*). Use \\n for line breaks. Keep it short, no jargon, and sound like a tech rebel. Example: "Yo, cmd not opening? Let’s crank it.\\n*Step 1:* Run sfc.\\n\\n*Step 2:* Check PATH." If vague, demand details with attitude using \\n.`
                                }]
                            }]
                        })
                    });
                    const data = await response.json();
                    let aiResponse = data.candidates[0].content.parts[0].text;

                    // Check for truncated response
                    if (aiResponse.length < 24 && !aiResponse.includes('Step')) {
                        aiResponse += '\n\nGimme more details, tech-head!';
                    }

                    // Remove loading class and type response
                    messageDiv.classList.remove('loading-text');
                    typeMessage(aiResponse, messageDiv, () => {
                        currentChat.messages.push({
                            type: 'ai',
                            text: aiResponse
                        });
                        saveChats();
                    });
                } catch (error) {
                    // Remove loading class and show error
                    messageDiv.classList.remove('loading-text');
                    const errorMessage = 'Whoa, hit a glitch! Try again or describe your issue differently.';
                    typeMessage(errorMessage, messageDiv, () => {
                        currentChat.messages.push({
                            type: 'ai',
                            text: errorMessage
                        });
                        saveChats();
                    });
                }
            }
        };

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        renderChats();
    }
});