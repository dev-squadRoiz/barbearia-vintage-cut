const supabaseUrl = "https://hohedpulfobsqaiarnit.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaGVkcHVsZm9ic3FhaWFybml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MTM4MDYsImV4cCI6MjEwNzQ4OTgwNn0.QlxAyav9y4r7yNqrA75qZHuuCjj2k5aWAd_GaaYtqe8";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);


document.addEventListener('DOMContentLoaded', () => {
    initLiveStatus();
    initMobileMenu();
    initMinDate();
});

// MÁSCARA / TELEFONE
const phoneInput = document.getElementById('telefone');

if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length > 0) {
            value = `(${value}`;
        }

        e.target.value = value;
    });
}

//VERIFICAÇÃO EM TEMPO REAL: ABERTO OU FECHADO
function initLiveStatus() {
    const statusContainer = document.getElementById('live-status');
    const statusText = document.getElementById('status-text');

    if (!statusContainer || !statusText) return;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: Domingo, 1: Segunda
    const currentHour = now.getHours();

    // Horários da Barbearia: Seg a Sáb (1 a 6) das 09h às 20h
    const isOpenDay = dayOfWeek >= 1 && dayOfWeek <= 6;
    const isOpenHour = currentHour >= 9 && currentHour < 20;

    if (isOpenDay && isOpenHour) {
        statusContainer.className = 'status-badge open';
        statusText.textContent = 'Aberto Agora';
    } else {
        statusContainer.className = 'status-badge closed';
        statusText.textContent = 'Fechado Agora';
    }
}

// MENU MOBILE HAMBÚRGUER
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Fechar ao clicar em algum link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
}

//SELEÇÃO DIRETA DE SERVIÇO NA TABELA
function selecionarServico(nomeServico) {
    const selectServico = document.getElementById('servico');
    if (!selectServico) return;

    for (let i = 0; i < selectServico.options.length; i++) {
        if (selectServico.options[i].text.includes(nomeServico)) {
            selectServico.selectedIndex = i;
            break;
        }
    }

    const agendamentoSection = document.getElementById('agendamento');
    if (agendamentoSection) {
        agendamentoSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// DEFINIR DATA MÍNIMA COMO HOJE NO CAMPO DE DATA
function initMinDate() {
    const dateInput = document.getElementById('data');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
}

//PROCESSAMENTO DO AGENDAMENTO E MODAL
async function processarAgendamento(e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const servico = document.getElementById('servico').value;
    const dataRaw = document.getElementById('data').value;
    const hora = document.getElementById('hora').value;

    if (!nome || !telefone || !servico || !dataRaw || !hora) {
        alert('Por favor, preencha todos os campos do formulário.');
        return;
    }

    const btnSubmit = document.querySelector('#appointmentForm button[type="submit"]');
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando no banco...';
    btnSubmit.disabled = true;

    try {
        // INSERT no banco de dados 
        const { data, error } = await supabaseClient
            .from('agendamentos')
            .insert([
                {
                    nome: nome,
                    telefone: telefone,
                    servico: servico,
                    data_agendamento: dataRaw, 
                    hora: hora
                }
            ]);

        if (error) {
            throw error;
        }

        const partesData = dataRaw.split('-');
        const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

        // Atualiza resumo no modal
        const summaryBox = document.getElementById('modalSummary');
        summaryBox.innerHTML = `
            <p><strong>Nome:</strong> ${nome}</p>
            <p><strong>Telefone:</strong> ${telefone}</p>
            <p><strong>Serviço:</strong> ${servico}</p>
            <p><strong>Data:</strong> ${dataFormatada}</p>
            <p><strong>Horário:</strong> ${hora}</p>
            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ccc;">
            <p style="color: #137333; text-align: center;"><strong>✓ Salvo com sucesso no banco de dados!</strong></p>
        `;

        // Modifica o footer do modal
        const modalFooter = document.querySelector('.modal-footer');
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-primary btn-block" id="btnFecharModal">
                OK, Entendi
            </button>
        `;

        // Adiciona a ação de fechar e limpar o formulário
        document.getElementById('btnFecharModal').addEventListener('click', () => {
            fecharModal();
            document.getElementById('appointmentForm').reset();
        });

        // Abre o modal
        document.getElementById('bookingModal').classList.add('active');

    } catch (error) {
        console.error('Erro ao salvar no Supabase:', error);
        alert('Ocorreu um erro ao salvar seu agendamento no banco de dados. Tente novamente.');
    } finally {
        // Restaura o botão do formulário ao estado normal
        btnSubmit.innerHTML = textoOriginal;
        btnSubmit.disabled = false;
    }
}

// FUNÇÕES GLOBAIS DO MODAL 

function fecharModal() {
    document.getElementById('bookingModal').classList.remove('active');
}

// Fechar modal ao clicar fora do conteúdo
window.addEventListener('click', (e) => {
    const modal = document.getElementById('bookingModal');
    if (e.target === modal) {
        fecharModal();
    }
});