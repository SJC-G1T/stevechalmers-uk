// Budget Tracker — localStorage version
(function() {
    'use strict';

    const STORAGE_KEY = 'budget_tracker_data';
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const CATEGORIES = ['Essential', 'Regular Bill', 'One-off', 'Salary', 'Irregular Cost', 'Debt'];

    let state = {
        transactions: [],
        settings: {},
        currentYear: new Date().getFullYear().toString(),
        hiddenMonths: [],
        debtsExpanded: false,
        undoStack: [],
        redoStack: [],
        editingCell: null,
        pendingEdit: null,
        loading: true
    };

    const elements = {};

    function initElements() {
        elements.sidebar = document.getElementById('sidebar');
        elements.sidebarToggle = document.getElementById('sidebarToggle');
        elements.yearSelect = document.getElementById('yearSelect');
        elements.balanceToday = document.getElementById('balanceToday');
        elements.yearEndNetWorth = document.getElementById('yearEndNetWorth');
        elements.gridBody = document.getElementById('gridBody');
        elements.budgetGrid = document.getElementById('budgetGrid');
        elements.modalBackdrop = document.getElementById('modalBackdrop');
        elements.undoBtn = document.getElementById('undoBtn');
        elements.redoBtn = document.getElementById('redoBtn');
        elements.goToTodayBtn = document.getElementById('goToTodayBtn');
        elements.addRowBtn = document.getElementById('addRowBtn');
        elements.addRecurringBtn = document.getElementById('addRecurringBtn');
        elements.newYearBtn = document.getElementById('newYearBtn');
        elements.importBtn = document.getElementById('importBtn');
        elements.exportBtn = document.getElementById('exportBtn');
        elements.clearAllBtn = document.getElementById('clearAllBtn');
        elements.debtToggleBtn = document.getElementById('debtToggleBtn');
    }

    // --- localStorage persistence ---

    function loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.error('Failed to read storage:', e);
            return null;
        }
    }

    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                transactions: state.transactions,
                settings: state.settings
            }));
        } catch (e) {
            console.error('Failed to save storage:', e);
            showToast('Could not save data', 'error');
        }
    }

    function getDemoData() {
        const y = new Date().getFullYear();
        const id = (n) => 'demo_' + n;
        const tx = (n, mo, day, item, desc, cat, type, amount, paid) => ({
            id: id(n),
            date: `${y}-${String(mo).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
            item, description: desc, category: cat, type, amount: String(amount), paid: paid || false, archived: false
        });
        const transactions = [
            // January
            tx(1,  1,25, 'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   true),
            tx(2,  1, 1, 'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   true),
            tx(3,  1, 1, 'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   true),
            tx(4,  1, 2, 'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   68,   true),
            tx(5,  1, 2, 'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   54,   true),
            tx(6,  1, 3, 'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   true),
            tx(7,  1, 4, 'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   true),
            tx(8,  1, 4, 'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   true),
            tx(9,  1, 5, 'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   true),
            tx(10, 1,15, 'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   true),
            tx(11, 1,15, 'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   true),
            tx(12, 1,20, 'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   true),
            tx(13, 1,22, 'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   true),
            tx(14, 1,28, 'Dining out',    'Nandos & pub',                'One-off',        'Expense',   48,   true),
            // February
            tx(15, 2,25, 'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   true),
            tx(16, 2, 1, 'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   true),
            tx(17, 2, 1, 'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   true),
            tx(18, 2, 2, 'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   72,   true),
            tx(19, 2, 2, 'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   61,   true),
            tx(20, 2, 3, 'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   true),
            tx(21, 2, 4, 'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   true),
            tx(22, 2, 4, 'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   true),
            tx(23, 2, 5, 'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   true),
            tx(24, 2,15, 'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   true),
            tx(25, 2,15, 'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   true),
            tx(26, 2,20, 'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   true),
            tx(27, 2,14, 'Valentines',    'Dinner & flowers',            'One-off',        'Expense',   85,   true),
            tx(28, 2,22, 'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   true),
            // March
            tx(29, 3,25, 'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   true),
            tx(30, 3, 1, 'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   true),
            tx(31, 3, 1, 'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   true),
            tx(32, 3, 2, 'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   65,   true),
            tx(33, 3, 2, 'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   50,   true),
            tx(34, 3, 3, 'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   true),
            tx(35, 3, 4, 'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   true),
            tx(36, 3, 4, 'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   true),
            tx(37, 3, 5, 'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   true),
            tx(38, 3,15, 'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   true),
            tx(39, 3,15, 'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   true),
            tx(40, 3,19, 'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   true),
            tx(41, 3,28, 'Car Service',   'Annual car service & MOT',    'One-off',        'Expense',  320,   true),
            tx(42, 3,22, 'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   true),
            // April - present month (mix of paid and unpaid)
            tx(43, 4,25, 'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   false),
            tx(44, 4, 1, 'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   true),
            tx(45, 4, 1, 'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   true),
            tx(46, 4, 2, 'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   58,   true),
            tx(47, 4, 2, 'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   42,   true),
            tx(48, 4, 3, 'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   true),
            tx(49, 4, 4, 'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   true),
            tx(50, 4, 4, 'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   true),
            tx(51, 4, 5, 'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   true),
            tx(52, 4,15, 'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   false),
            tx(53, 4,15, 'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   false),
            tx(54, 4,19, 'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   false),
            tx(55, 4,22, 'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   false),
            // Future months (all unpaid)
            tx(56, 5,25, 'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   false),
            tx(57, 5, 1, 'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   false),
            tx(58, 5, 1, 'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   false),
            tx(59, 5, 2, 'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   55,   false),
            tx(60, 5, 2, 'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   38,   false),
            tx(61, 5, 3, 'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   false),
            tx(62, 5, 4, 'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   false),
            tx(63, 5, 4, 'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   false),
            tx(64, 5, 5, 'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   false),
            tx(65, 5,15, 'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   false),
            tx(66, 5,15, 'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   false),
            tx(67, 5,20, 'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   false),
            tx(68, 5,22, 'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   false),
            tx(69, 6,25, 'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   false),
            tx(70, 6, 1, 'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   false),
            tx(71, 6, 1, 'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   false),
            tx(72, 6, 2, 'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   52,   false),
            tx(73, 6, 2, 'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   34,   false),
            tx(74, 6, 3, 'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   false),
            tx(75, 6, 4, 'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   false),
            tx(76, 6, 4, 'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   false),
            tx(77, 6, 5, 'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   false),
            tx(78, 6,15, 'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   false),
            tx(79, 6,15, 'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   false),
            tx(80, 6,20, 'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   false),
            tx(81, 6,22, 'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   false),
            tx(82, 6,25, 'Holiday',       'Summer holiday deposit',      'One-off',        'Expense',  600,   false),
            tx(83, 7,25, 'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   false),
            tx(84, 7, 1, 'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   false),
            tx(85, 7, 1, 'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   false),
            tx(86, 7, 2, 'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   48,   false),
            tx(87, 7, 2, 'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   30,   false),
            tx(88, 7, 3, 'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   false),
            tx(89, 7, 4, 'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   false),
            tx(90, 7, 4, 'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   false),
            tx(91, 7, 5, 'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   false),
            tx(92, 7,15, 'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   false),
            tx(93, 7,15, 'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   false),
            tx(94, 7,20, 'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   false),
            tx(95, 7,22, 'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   false),
            tx(96, 8,25, 'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   false),
            tx(97, 8, 1, 'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   false),
            tx(98, 8, 1, 'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   false),
            tx(99, 8, 2, 'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   50,   false),
            tx(100,8, 2, 'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   32,   false),
            tx(101,8, 3, 'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   false),
            tx(102,8, 4, 'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   false),
            tx(103,8, 4, 'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   false),
            tx(104,8, 5, 'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   false),
            tx(105,8,15, 'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   false),
            tx(106,8,15, 'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   false),
            tx(107,8,20, 'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   false),
            tx(108,8,22, 'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   false),
            tx(109,9,25, 'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   false),
            tx(110,9, 1, 'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   false),
            tx(111,9, 1, 'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   false),
            tx(112,9, 2, 'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   55,   false),
            tx(113,9, 2, 'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   36,   false),
            tx(114,9, 3, 'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   false),
            tx(115,9, 4, 'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   false),
            tx(116,9, 4, 'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   false),
            tx(117,9, 5, 'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   false),
            tx(118,9,15, 'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   false),
            tx(119,9,15, 'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   false),
            tx(120,9,20, 'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   false),
            tx(121,9,22, 'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   false),
            tx(122,10,25,'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   false),
            tx(123,10, 1,'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   false),
            tx(124,10, 1,'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   false),
            tx(125,10, 2,'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   62,   false),
            tx(126,10, 2,'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   44,   false),
            tx(127,10, 3,'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   false),
            tx(128,10, 4,'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   false),
            tx(129,10, 4,'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   false),
            tx(130,10, 5,'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   false),
            tx(131,10,15,'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   false),
            tx(132,10,15,'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   false),
            tx(133,10,20,'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   false),
            tx(134,10,22,'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   false),
            tx(135,11,25,'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   false),
            tx(136,11, 1,'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   false),
            tx(137,11, 1,'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   false),
            tx(138,11, 2,'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   70,   false),
            tx(139,11, 2,'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   52,   false),
            tx(140,11, 3,'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   false),
            tx(141,11, 4,'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   false),
            tx(142,11, 4,'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   false),
            tx(143,11, 5,'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   false),
            tx(144,11,15,'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   false),
            tx(145,11,15,'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   false),
            tx(146,11,20,'Groceries',     'Tesco weekly shop x4',        'Essential',      'Expense',  220,   false),
            tx(147,11,22,'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   false),
            tx(148,12,25,'Salary',        'Monthly salary',              'Salary',         'Income',  2800,   false),
            tx(149,12,24,'Xmas Bonus',    'Annual performance bonus',    'Salary',         'Income',   500,   false),
            tx(150,12, 1,'Rent',          'Monthly rent payment',        'Essential',      'Expense',  950,   false),
            tx(151,12, 1,'Council Tax',   'Band C council tax',          'Essential',      'Expense',  142,   false),
            tx(152,12, 2,'Electricity',   'British Gas electricity',     'Regular Bill',   'Expense',   75,   false),
            tx(153,12, 2,'Gas',           'British Gas gas',             'Regular Bill',   'Expense',   60,   false),
            tx(154,12, 3,'Broadband',     'Sky Broadband',               'Regular Bill',   'Expense',   40,   false),
            tx(155,12, 4,'Netflix',       'Netflix subscription',        'Regular Bill',   'Expense',   18,   false),
            tx(156,12, 4,'Spotify',       'Spotify Premium',             'Regular Bill',   'Expense',   11,   false),
            tx(157,12, 5,'Gym',           'PureGym monthly membership',  'Regular Bill',   'Expense',   24,   false),
            tx(158,12,15,'Credit Card',   'Barclaycard minimum payment', 'Debt',           'Expense',  150,   false),
            tx(159,12,15,'Car Loan',      'Car finance monthly',         'Debt',           'Expense',  220,   false),
            tx(160,12,20,'Groceries',     'Christmas food shop',         'Essential',      'Expense',  320,   false),
            tx(161,12,22,'Christmas',     'Gifts & celebrations',        'One-off',        'Expense',  450,   false),
            tx(162,12,22,'Petrol',        'Shell garage',                'Irregular Cost', 'Expense',   65,   false),
        ];
        const settings = {
            startingBalance: '1250',
            asOfDate: `${y}-01-01`,
            debts: JSON.stringify([
                { id: 'barclaycard', name: 'Barclaycard', amount: 2400, keyword: 'barclaycard' },
                { id: 'car_loan',    name: 'Car Loan',    amount: 6800, keyword: 'car finance' }
            ]),
            currentYear: String(y),
            hiddenMonths: JSON.stringify([]),
            debtsExpanded: 'false',
            scratchpad: ''
        };
        return { transactions, settings };
    }

    function loadData() {
        const stored = loadFromStorage();
        if (stored) {
            state.transactions = stored.transactions || [];
            state.settings = stored.settings || {};
        } else {
            const demo = getDemoData();
            state.transactions = demo.transactions;
            state.settings = demo.settings;
            saveToStorage();
        }
        state.currentYear = state.settings.currentYear || new Date().getFullYear().toString();
        state.hiddenMonths = state.settings.hiddenMonths ? JSON.parse(state.settings.hiddenMonths) : [];
        state.debtsExpanded = state.settings.debtsExpanded === 'true';
        state.loading = false;
    }

    function saveSettings() {
        state.settings.currentYear = state.currentYear;
        state.settings.hiddenMonths = JSON.stringify(state.hiddenMonths);
        state.settings.debtsExpanded = state.debtsExpanded.toString();
        if (!state.settings.startingBalance) state.settings.startingBalance = '0';
        if (!state.settings.asOfDate) state.settings.asOfDate = state.currentYear + '-01-01';
        if (!state.settings.debts) state.settings.debts = JSON.stringify([]);
        if (!state.settings.scratchpad) state.settings.scratchpad = '';
        saveToStorage();
    }

    // --- Helpers ---

    function generateId() {
        return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function getYearTransactions() {
        return state.transactions.filter(tx => tx.date.startsWith(state.currentYear));
    }

    function getStartingBalance() {
        return parseFloat(state.settings.startingBalance || 0);
    }

    function getDebtsArray() {
        const debtsData = state.settings.debts ? JSON.parse(state.settings.debts) : {};
        if (Array.isArray(debtsData)) return debtsData;
        return Object.entries(debtsData).map(([key, amount]) => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            amount: amount,
            keyword: key
        }));
    }

    function getDebts() {
        const debtsData = state.settings.debts ? JSON.parse(state.settings.debts) : [];
        if (Array.isArray(debtsData)) {
            const obj = {};
            debtsData.forEach(debt => { obj[debt.id] = debt.amount; });
            return obj;
        }
        return debtsData;
    }

    function calculateDailyBalances() {
        const yearTxs = getYearTransactions().sort((a, b) => new Date(a.date) - new Date(b.date));
        let balance = getBalanceForToday();
        const debts = getDebts();
        const asOfDate = state.settings.asOfDate ? new Date(state.settings.asOfDate) : new Date(state.currentYear + '-01-01');
        const debtsArray = getDebtsArray();
        const results = [];

        for (const tx of yearTxs) {
            const txDate = new Date(tx.date);
            if (txDate >= asOfDate && !tx.paid) {
                const amount = parseFloat(tx.amount);
                if (tx.type === 'Income') balance += amount;
                else if (tx.type === 'Expense') balance -= amount;
            }

            const descLower = (tx.description || '').toLowerCase();
            for (const debt of debtsArray) {
                const keyword = debt.keyword.toLowerCase();
                if (descLower.includes(keyword)) {
                    if (debts[debt.id] !== undefined) {
                        debts[debt.id] = Math.max(0, debts[debt.id] - parseFloat(tx.amount));
                    }
                    break;
                }
            }

            results.push({
                ...tx,
                dailyBalance: balance,
                debtBalances: { ...debts },
                totalDebt: Object.values(debts).reduce((sum, v) => sum + v, 0)
            });
        }
        return results;
    }

    function getBalanceForToday() {
        let balance = getStartingBalance();
        const asOfDate = state.settings.asOfDate ? new Date(state.settings.asOfDate) : new Date(state.currentYear + '-01-01');
        for (const tx of state.transactions) {
            const txDate = new Date(tx.date);
            const amount = parseFloat(tx.amount);
            if (txDate < asOfDate && !tx.paid) {
                if (tx.type === 'Income') balance += amount;
                else if (tx.type === 'Expense') balance -= amount;
            }
        }
        return balance;
    }

    function getYearEndNetWorth() {
        const calculated = calculateDailyBalances();
        let lastIncomeIndex = -1;
        for (let i = calculated.length - 1; i >= 0; i--) {
            if (calculated[i].type === 'Income') { lastIncomeIndex = i; break; }
        }
        if (lastIncomeIndex <= 0) return 0;
        const rowBeforeIncome = calculated[lastIncomeIndex - 1];
        return rowBeforeIncome.dailyBalance - rowBeforeIncome.totalDebt;
    }

    function isRecurringItem(item) {
        return getYearTransactions().filter(t => t.item === item).length > 1;
    }

    function getMatchingTransactions(item) {
        return getYearTransactions().filter(t => t.item === item);
    }

    // --- Render ---

    function renderYearSelector() {
        const years = [...new Set(state.transactions.map(tx => tx.date.substring(0, 4)))].sort();
        if (years.length === 0) years.push(state.currentYear);
        elements.yearSelect.innerHTML = years.map(year =>
            `<option value="${year}" ${year === state.currentYear ? 'selected' : ''}>${year}</option>`
        ).join('');
    }

    function renderBalanceToday() {
        const balance = getBalanceForToday();
        elements.balanceToday.textContent = formatCurrency(balance);
        elements.balanceToday.classList.toggle('negative', balance < 0);
    }

    function renderYearEndNetWorth() {
        const netWorth = getYearEndNetWorth();
        elements.yearEndNetWorth.textContent = formatCurrency(netWorth);
        elements.yearEndNetWorth.classList.toggle('negative', netWorth < 0);
    }

    function renderDebtHeaders() {
        const debtsArray = getDebtsArray();
        const thead = document.querySelector('#budgetGrid thead tr');
        if (!thead) return;

        thead.querySelectorAll('.col-debt.debt-col').forEach(th => th.remove());
        const existingToggle = thead.querySelector('.col-debt-toggle');
        if (existingToggle) existingToggle.remove();

        const balanceHeader = Array.from(thead.children).find(th => th.classList.contains('col-balance'));
        if (!balanceHeader) return;

        let insertAfter = balanceHeader;
        debtsArray.forEach(debt => {
            const th = document.createElement('th');
            th.className = 'col-debt debt-col';
            th.textContent = debt.name;
            insertAfter.insertAdjacentElement('afterend', th);
            insertAfter = th;
        });

        const totalTh = document.createElement('th');
        totalTh.className = 'col-debt debt-col';
        totalTh.textContent = 'Total Debt';
        insertAfter.insertAdjacentElement('afterend', totalTh);

        const toggleTh = document.createElement('th');
        toggleTh.className = 'col-debt-toggle';
        toggleTh.innerHTML = '<button class="debt-toggle-btn" id="debtToggleBtn" title="Toggle Debt Columns"><i data-lucide="columns-3" class="icon"></i></button>';
        totalTh.insertAdjacentElement('afterend', toggleTh);

        const newToggleBtn = document.getElementById('debtToggleBtn');
        if (newToggleBtn) newToggleBtn.addEventListener('click', handleDebtToggle);

        elements.debtToggleBtn = document.getElementById('debtToggleBtn');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderGrid() {
        const calculated = calculateDailyBalances();
        const debtsArray = getDebtsArray();
        const today = new Date().toISOString().split('T')[0];

        if (calculated.length === 0) {
            elements.gridBody.innerHTML = '<tr><td colspan="12" class="empty-state"><div class="empty-state-icon"><i data-lucide="inbox" style="width:48px;height:48px;"></i></div><div class="empty-state-text">No transactions for ' + state.currentYear + '</div></td></tr>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const itemCounts = {};
        calculated.forEach(tx => { itemCounts[tx.item] = (itemCounts[tx.item] || 0) + 1; });

        elements.gridBody.innerHTML = calculated.map(tx => {
            const txDate = new Date(tx.date);
            const month = txDate.getMonth() + 1;
            const isHidden = state.hiddenMonths.includes(month);
            const isToday = tx.date === today;
            const isPaid = tx.paid ? true : false;
            const isArchived = tx.archived ? true : false;
            const isRecurring = itemCounts[tx.item] > 1;

            const rowClasses = [
                isPaid ? 'row-paid' : '',
                isHidden ? 'row-hidden' : '',
                isToday ? 'row-today' : '',
                isArchived ? 'row-archived' : ''
            ].filter(Boolean).join(' ');

            const categoryClass = getCategoryClass(tx.category);

            return '<tr class="' + rowClasses + '" data-id="' + tx.id + '">' +
                '<td class="col-date editable-cell" data-field="date">' + formatDate(tx.date) + '</td>' +
                '<td class="col-item editable-cell" data-field="item">' + escapeHtml(tx.item) + (isRecurring ? '<span class="recurring-indicator" title="Recurring"><i data-lucide="repeat" class="icon"></i></span>' : '') + '</td>' +
                '<td class="col-desc editable-cell" data-field="description" title="' + escapeHtml(tx.description) + '">' + escapeHtml(tx.description) + '</td>' +
                '<td class="col-category editable-cell" data-field="category"><span class="category-badge ' + categoryClass + '">' + escapeHtml(tx.category) + '</span></td>' +
                '<td class="col-type editable-cell" data-field="type"><span class="type-' + tx.type.toLowerCase() + '">' + tx.type + '</span></td>' +
                '<td class="col-amount editable-cell" data-field="amount" style="text-align: right;">' + formatCurrency(tx.amount) + '</td>' +
                '<td class="col-paid paid-toggle" data-field="paid" data-id="' + tx.id + '"><span class="paid-status ' + (isPaid ? 'is-paid' : 'is-unpaid') + '">' + (isPaid ? 'Paid' : 'Unpaid') + '</span></td>' +
                '<td class="col-balance" style="text-align: right;' + (tx.dailyBalance < 0 ? 'color: var(--danger);' : '') + '">' + formatCurrency(tx.dailyBalance) + '</td>' +
                debtsArray.map(debt =>
                    '<td class="col-debt debt-col ' + (state.debtsExpanded ? 'visible' : '') + '">' +
                    formatCurrency(tx.debtBalances[debt.id] || 0) + '</td>'
                ).join('') +
                '<td class="col-debt debt-col ' + (state.debtsExpanded ? 'visible' : '') + '">' + formatCurrency(tx.totalDebt) + '</td>' +
                '<td class="col-debt-toggle"></td>' +
                '<td class="col-actions"><div class="row-actions">' +
                '<button class="row-action-btn archive" title="' + (tx.archived ? 'Restore' : 'Archive') + '" data-action="archive"><i data-lucide="' + (tx.archived ? 'archive-restore' : 'archive') + '" class="icon"></i></button>' +
                '<button class="row-action-btn delete" title="Delete" data-action="delete"><i data-lucide="trash-2" class="icon"></i></button>' +
                '</div></td></tr>';
        }).join('');

        updateDebtToggleButton();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function getCategoryClass(category) {
        const map = {
            'Salary': 'salary', 'Essential': 'essential', 'Regular Bill': 'regular-bill',
            'One-off': 'one-off', 'Irregular Cost': 'irregular-cost', 'Debt': 'debt'
        };
        return map[category] || '';
    }

    function updateDebtToggleButton() {
        const btn = document.getElementById('debtToggleBtn');
        if (btn) btn.classList.toggle('active', state.debtsExpanded);
    }

    function updateUndoRedoButtons() {
        elements.undoBtn.disabled = state.undoStack.length === 0;
        elements.redoBtn.disabled = state.redoStack.length === 0;
    }

    function formatCurrency(amount) {
        return '£' + parseFloat(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Modals ---

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            elements.modalBackdrop.classList.add('active');
            modal.classList.add('active');
            const firstInput = modal.querySelector('input:not([type="checkbox"]):not([type="radio"]), select');
            if (firstInput) setTimeout(() => firstInput.focus(), 100);
            if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
        }
    }

    function closeAllModals() {
        const calcModal = document.getElementById('calculatorModal');
        if (calcModal && calcModal.classList.contains('active')) {
            const scratchpad = document.getElementById('scratchpad');
            if (scratchpad) {
                state.settings.scratchpad = scratchpad.value;
                saveSettings();
            }
        }
        elements.modalBackdrop.classList.remove('active');
        document.querySelectorAll('.modal.active').forEach(modal => modal.classList.remove('active'));
    }

    function showToast(message, type) {
        type = type || 'success';
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- Event handlers ---

    function handleSidebarToggle() {
        elements.sidebar.classList.toggle('open');
    }

    function handleNavItemClick(e) {
        const action = e.currentTarget.dataset.action;
        switch (action) {
            case 'startingBalance': openStartingBalanceModal(); break;
            case 'quickFilter': openQuickFilterModal(); break;
            case 'debts': openDebtsModal(); break;
            case 'recurringCosts': openRecurringCostsModal(); break;
            case 'calculator': openCalculatorModal(); break;
            case 'hideMonths': openHideArchiveModal(); break;
        }
    }

    function handleYearChange() {
        state.currentYear = elements.yearSelect.value;
        saveSettings();
        renderBalanceToday();
        renderYearEndNetWorth();
        renderGrid();
    }

    function handleGoToToday() {
        const today = new Date().toISOString().split('T')[0];
        const rows = elements.gridBody.querySelectorAll('tr[data-id]');
        let targetRow = null;
        for (const row of rows) {
            const txId = row.dataset.id;
            const tx = state.transactions.find(t => t.id === txId);
            if (tx && tx.date >= today) { targetRow = row; break; }
        }
        if (targetRow) {
            targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetRow.style.animation = 'none';
            targetRow.offsetHeight;
            targetRow.style.animation = 'highlight 1s ease';
        } else {
            showToast('No transactions found for today or future', 'error');
        }
    }

    function handleAddRow() {
        const today = new Date().toISOString().split('T')[0];
        const newTx = {
            id: generateId(),
            date: today,
            item: 'New Item',
            description: '',
            category: 'Essential',
            type: 'Expense',
            amount: 0,
            paid: 0,
            archived: 0
        };

        state.transactions.push(newTx);
        state.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        saveToStorage();
        recordAction({ type: 'add', transaction: { ...newTx } });

        renderGrid();
        renderBalanceToday();
        renderYearEndNetWorth();

        setTimeout(() => {
            const newRow = elements.gridBody.querySelector('tr[data-id="' + newTx.id + '"]');
            if (newRow) {
                newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const itemCell = newRow.querySelector('[data-field="item"]');
                if (itemCell) startEditing(itemCell, newTx.id, 'item');
            }
        }, 100);

        showToast('Row added');
    }

    function handleDebtToggle() {
        state.debtsExpanded = !state.debtsExpanded;
        saveSettings();
        document.querySelectorAll('.debt-col').forEach(col => {
            col.classList.toggle('visible', state.debtsExpanded);
        });
        updateDebtToggleButton();
    }

    function handleUndo() {
        if (state.undoStack.length === 0) { showToast('Nothing to undo', 'error'); return; }
        const action = state.undoStack.pop();
        state.redoStack.push(action);
        applyUndoAction(action, true);
        updateUndoRedoButtons();
    }

    function handleRedo() {
        if (state.redoStack.length === 0) { showToast('Nothing to redo', 'error'); return; }
        const action = state.redoStack.pop();
        state.undoStack.push(action);
        applyUndoAction(action, false);
        updateUndoRedoButtons();
    }

    function applyUndoAction(action, isUndo) {
        if (action.type === 'add') {
            if (isUndo) {
                state.transactions = state.transactions.filter(t => t.id !== action.transaction.id);
                showToast('Undone: Row deleted');
            } else {
                state.transactions.push(action.transaction);
                showToast('Redone: Row added');
            }
        } else if (action.type === 'edit') {
            const tx = state.transactions.find(t => t.id === action.id);
            if (tx) {
                tx[action.field] = isUndo ? action.oldValue : action.newValue;
                showToast(isUndo ? 'Undone: Edit reverted' : 'Redone: Edit reapplied');
            }
        } else if (action.type === 'delete') {
            if (isUndo) {
                state.transactions.push(action.transaction);
                showToast('Undone: Row restored');
            } else {
                state.transactions = state.transactions.filter(t => t.id !== action.transaction.id);
                showToast('Redone: Row deleted');
            }
        } else if (action.type === 'delete_recurring') {
            if (isUndo) {
                action.transactions.forEach(tx => state.transactions.push(tx));
                showToast('Undone: ' + action.transactions.length + ' rows restored');
            } else {
                state.transactions = state.transactions.filter(t => t.item !== action.item);
                showToast('Redone: ' + action.transactions.length + ' rows deleted');
            }
        }
        state.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        saveToStorage();
        renderGrid();
        renderBalanceToday();
        renderYearEndNetWorth();
    }

    function recordAction(action) {
        state.undoStack.push(action);
        state.redoStack = [];
        updateUndoRedoButtons();
        if (state.undoStack.length > 50) state.undoStack.shift();
    }

    function handleExport() {
        try {
            const exportData = { transactions: state.transactions, settings: state.settings };
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'budget_export_' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
            showToast('Data exported');
        } catch (e) {
            showToast('Export failed', 'error');
        }
    }

    function openImportModal() {
        openModal('importModal');
    }

    function handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (!imported.transactions || !Array.isArray(imported.transactions)) {
                    showToast('Invalid file format', 'error');
                    return;
                }
                state.transactions = imported.transactions;
                if (imported.settings) state.settings = imported.settings;
                state.currentYear = state.settings.currentYear || new Date().getFullYear().toString();
                state.hiddenMonths = state.settings.hiddenMonths ? JSON.parse(state.settings.hiddenMonths) : [];
                state.debtsExpanded = state.settings.debtsExpanded === 'true';
                saveToStorage();
                closeAllModals();
                renderYearSelector();
                renderBalanceToday();
                renderYearEndNetWorth();
                renderDebtHeaders();
                renderGrid();
                updateUndoRedoButtons();
                showToast('Data imported successfully');
            } catch (err) {
                showToast('Failed to read file', 'error');
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    }

    // --- Cell editing ---

    function handleCellClick(e) {
        const cell = e.target.closest('.editable-cell, .paid-toggle');
        if (!cell) return;

        const row = cell.closest('tr');
        const txId = row.dataset.id;
        const field = cell.dataset.field;

        if (field === 'paid') { togglePaidStatus(txId); return; }

        const tx = state.transactions.find(t => t.id === txId);
        if (tx && isRecurringItem(tx.item) && ['amount', 'item', 'description', 'category', 'type'].includes(field)) {
            state.pendingEdit = { txId: txId, field: field, cell: cell };
            openEditRecurringModal(tx);
        } else {
            startEditing(cell, txId, field);
        }
    }

    function togglePaidStatus(txId) {
        const tx = state.transactions.find(t => t.id === txId);
        if (!tx) return;
        const oldPaid = tx.paid;
        tx.paid = tx.paid ? 0 : 1;
        recordAction({ type: 'edit', id: txId, field: 'paid', oldValue: oldPaid, newValue: tx.paid });
        saveToStorage();
        renderGrid();
        renderBalanceToday();
        renderYearEndNetWorth();
        showToast(tx.paid ? 'Marked as paid' : 'Marked as unpaid');
    }

    function openEditRecurringModal(tx) {
        const matches = getMatchingTransactions(tx.item);
        const futureMatches = matches.filter(t => t.date >= tx.date);
        document.getElementById('recurringInfo').innerHTML =
            '<div class="recurring-info-row"><span class="recurring-info-label">Item:</span><span class="recurring-info-value">' + escapeHtml(tx.item) + '</span></div>' +
            '<div class="recurring-info-row"><span class="recurring-info-label">Total instances:</span><span class="recurring-info-value">' + matches.length + '</span></div>' +
            '<div class="recurring-info-row"><span class="recurring-info-label">This & future:</span><span class="recurring-info-value">' + futureMatches.length + '</span></div>';
        openModal('editRecurringModal');
    }

    function handleEditThisOnly() {
        closeAllModals();
        if (state.pendingEdit) {
            const pe = state.pendingEdit;
            state.pendingEdit = null;
            startEditing(pe.cell, pe.txId, pe.field);
        }
    }

    function handleEditAllMatching() {
        closeAllModals();
        if (state.pendingEdit) {
            const tx = state.transactions.find(t => t.id === state.pendingEdit.txId);
            state.pendingEdit.editMode = 'all';
            state.pendingEdit.matchItem = tx.item;
            const cell = document.querySelector('tr[data-id="' + state.pendingEdit.txId + '"] [data-field="' + state.pendingEdit.field + '"]');
            if (cell) startEditing(cell, state.pendingEdit.txId, state.pendingEdit.field);
        }
    }

    function handleEditFuture() {
        closeAllModals();
        if (state.pendingEdit) {
            const tx = state.transactions.find(t => t.id === state.pendingEdit.txId);
            state.pendingEdit.editMode = 'future';
            state.pendingEdit.matchItem = tx.item;
            state.pendingEdit.fromDate = tx.date;
            const cell = document.querySelector('tr[data-id="' + state.pendingEdit.txId + '"] [data-field="' + state.pendingEdit.field + '"]');
            if (cell) startEditing(cell, state.pendingEdit.txId, state.pendingEdit.field);
        }
    }

    function startEditing(cell, txId, field) {
        if (state.editingCell) commitEdit();

        const tx = state.transactions.find(t => t.id === txId);
        if (!tx) return;

        state.editingCell = { cell: cell, txId: txId, field: field };
        cell.classList.add('editing');

        let input;
        if (field === 'date') {
            input = document.createElement('input');
            input.type = 'date';
            input.value = tx.date;
        } else if (field === 'type') {
            input = document.createElement('select');
            input.innerHTML = '<option value="Income"' + (tx.type === 'Income' ? ' selected' : '') + '>Income</option><option value="Expense"' + (tx.type === 'Expense' ? ' selected' : '') + '>Expense</option>';
        } else if (field === 'category') {
            input = document.createElement('select');
            input.innerHTML = CATEGORIES.map(c => '<option value="' + c + '"' + (tx.category === c ? ' selected' : '') + '>' + c + '</option>').join('');
        } else if (field === 'amount') {
            input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01';
            input.value = tx.amount;
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = tx[field] || '';
        }

        cell.textContent = '';
        cell.appendChild(input);
        input.focus();
        if (input.select) input.select();

        input.addEventListener('blur', () => commitEdit());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitEdit(); moveToNextCell(cell); }
            else if (e.key === 'Escape') { cancelEdit(); }
            else if (e.key === 'Tab') { e.preventDefault(); commitEdit(); if (e.shiftKey) moveToPrevCell(cell); else moveToNextCell(cell); }
        });
    }

    function commitEdit() {
        if (!state.editingCell) return;

        const ec = state.editingCell;
        const input = ec.cell.querySelector('input, select');
        if (!input) { state.editingCell = null; return; }

        const tx = state.transactions.find(t => t.id === ec.txId);
        if (!tx) { state.editingCell = null; return; }

        let oldValue = tx[ec.field];
        let newValue = input.value;

        if (ec.field === 'amount') newValue = parseFloat(newValue) || 0;
        else if (ec.field === 'paid') newValue = parseInt(newValue);

        if (oldValue != newValue) {
            if (state.pendingEdit && state.pendingEdit.editMode) {
                const pe = state.pendingEdit;
                const txsToUpdate = state.transactions.filter(t => {
                    if (t.item === pe.matchItem) {
                        if (pe.editMode === 'all' || (pe.editMode === 'future' && t.date >= pe.fromDate)) return true;
                    }
                    return false;
                });
                txsToUpdate.forEach(t => { t[ec.field] = newValue; });
                state.pendingEdit = null;
            } else {
                recordAction({ type: 'edit', id: ec.txId, field: ec.field, oldValue: oldValue, newValue: newValue });
                tx[ec.field] = newValue;
            }
            if (ec.field === 'date') state.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
            saveToStorage();
        }

        state.editingCell = null;
        state.pendingEdit = null;
        ec.cell.classList.remove('editing');

        renderGrid();
        renderBalanceToday();
        renderYearEndNetWorth();
        updateUndoRedoButtons();
    }

    function cancelEdit() {
        if (!state.editingCell) return;
        const cell = state.editingCell.cell;
        state.editingCell = null;
        state.pendingEdit = null;
        cell.classList.remove('editing');
        renderGrid();
    }

    function moveToNextCell(currentCell) {
        const editableCells = Array.from(elements.gridBody.querySelectorAll('.editable-cell'));
        const currentIndex = editableCells.indexOf(currentCell);
        if (currentIndex < editableCells.length - 1) {
            const nextCell = editableCells[currentIndex + 1];
            startEditing(nextCell, nextCell.closest('tr').dataset.id, nextCell.dataset.field);
        }
    }

    function moveToPrevCell(currentCell) {
        const editableCells = Array.from(elements.gridBody.querySelectorAll('.editable-cell'));
        const currentIndex = editableCells.indexOf(currentCell);
        if (currentIndex > 0) {
            const prevCell = editableCells[currentIndex - 1];
            startEditing(prevCell, prevCell.closest('tr').dataset.id, prevCell.dataset.field);
        }
    }

    // --- Row actions ---

    function handleRowAction(e) {
        const btn = e.target.closest('.row-action-btn');
        if (!btn) return;
        const row = btn.closest('tr');
        const txId = row.dataset.id;
        const action = btn.dataset.action;
        if (action === 'archive') toggleArchive(txId);
        else if (action === 'delete') {
            const tx = state.transactions.find(t => t.id === txId);
            if (tx && isRecurringItem(tx.item)) openDeleteRecurringModal(tx);
            else deleteRow(txId);
        }
    }

    function openDeleteRecurringModal(tx) {
        const matches = getMatchingTransactions(tx.item);
        document.getElementById('deleteRecurringInfo').innerHTML =
            '<div class="recurring-info-row"><span class="recurring-info-label">Item:</span><span class="recurring-info-value">' + escapeHtml(tx.item) + '</span></div>' +
            '<div class="recurring-info-row"><span class="recurring-info-label">Total instances:</span><span class="recurring-info-value">' + matches.length + '</span></div>' +
            '<div class="recurring-info-row"><span class="recurring-info-label">Total amount:</span><span class="recurring-info-value">' + formatCurrency(matches.reduce((sum, t) => sum + parseFloat(t.amount), 0)) + '</span></div>';
        state.pendingDelete = { txId: tx.id, item: tx.item };
        openModal('deleteRecurringModal');
    }

    function handleDeleteThisOnly() {
        if (!state.pendingDelete) return;
        closeAllModals();
        deleteRow(state.pendingDelete.txId);
        state.pendingDelete = null;
    }

    function handleDeleteAllRecurring() {
        if (!state.pendingDelete) return;
        const item = state.pendingDelete.item;
        const matches = getMatchingTransactions(item);
        if (!confirm('Delete all ' + matches.length + ' instances of "' + item + '"?')) return;

        recordAction({ type: 'delete_recurring', item: item, transactions: matches.map(t => ({ ...t })) });
        state.transactions = state.transactions.filter(t => t.item !== item);
        saveToStorage();

        closeAllModals();
        renderGrid();
        renderBalanceToday();
        renderYearEndNetWorth();
        updateUndoRedoButtons();
        showToast('Deleted ' + matches.length + ' recurring transactions');
        state.pendingDelete = null;
    }

    function toggleArchive(txId) {
        const tx = state.transactions.find(t => t.id === txId);
        if (!tx) return;
        tx.archived = tx.archived ? 0 : 1;
        saveToStorage();
        renderGrid();
        showToast(tx.archived ? 'Row archived' : 'Row restored');
    }

    function deleteRow(txId) {
        if (!confirm('Are you sure you want to delete this row?')) return;
        const tx = state.transactions.find(t => t.id === txId);
        if (!tx) return;
        state.transactions = state.transactions.filter(t => t.id !== txId);
        recordAction({ type: 'delete', transaction: { ...tx } });
        saveToStorage();
        renderGrid();
        renderBalanceToday();
        renderYearEndNetWorth();
        showToast('Row deleted');
    }

    // --- Add Recurring ---

    function openAddRecurringModal() {
        document.getElementById('recurringItem').value = '';
        document.getElementById('recurringDescription').value = '';
        document.getElementById('recurringCategory').value = 'Regular Bill';
        document.getElementById('recurringType').value = 'Expense';
        document.getElementById('recurringAmount').value = '';
        document.getElementById('recurringDay').value = '1';
        document.getElementById('recurringStartMonth').value = '1';
        document.getElementById('recurringEndMonth').value = '12';
        document.getElementById('previewSummary').innerHTML = '';
        openModal('addRecurringModal');
    }

    function saveRecurringTransactions() {
        const item = document.getElementById('recurringItem').value.trim();
        const description = document.getElementById('recurringDescription').value.trim();
        const category = document.getElementById('recurringCategory').value;
        const type = document.getElementById('recurringType').value;
        const amount = parseFloat(document.getElementById('recurringAmount').value);
        const day = document.getElementById('recurringDay').value;
        const startMonth = parseInt(document.getElementById('recurringStartMonth').value);
        const endMonth = parseInt(document.getElementById('recurringEndMonth').value);

        if (!item || !amount) { showToast('Item and amount are required', 'error'); return; }

        const transactions = [];
        for (let month = startMonth; month <= endMonth; month++) {
            let txDay = day === 'last' ? new Date(parseInt(state.currentYear), month, 0).getDate() : parseInt(day);
            transactions.push({
                id: generateId(),
                date: state.currentYear + '-' + String(month).padStart(2, '0') + '-' + String(txDay).padStart(2, '0'),
                item: item,
                description: description,
                category: category,
                type: type,
                amount: amount,
                paid: 0,
                archived: 0
            });
        }

        transactions.forEach(tx => state.transactions.push(tx));
        state.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        saveToStorage();

        closeAllModals();
        renderGrid();
        renderBalanceToday();
        renderYearEndNetWorth();
        showToast(transactions.length + ' recurring transactions created');
    }

    // --- Starting Balance ---

    function openStartingBalanceModal() {
        const balanceInput = document.getElementById('startingBalanceInput');
        const dateInput = document.getElementById('asOfDateInput');
        const handleEnter = (e) => { if (e.key === 'Enter') { e.preventDefault(); saveStartingBalance(); } };
        balanceInput.removeEventListener('keypress', handleEnter);
        dateInput.removeEventListener('keypress', handleEnter);
        balanceInput.addEventListener('keypress', handleEnter);
        dateInput.addEventListener('keypress', handleEnter);
        balanceInput.value = getStartingBalance();
        dateInput.value = state.settings.asOfDate || state.currentYear + '-01-01';
        openModal('startingBalanceModal');
    }

    function saveStartingBalance() {
        state.settings.startingBalance = document.getElementById('startingBalanceInput').value;
        state.settings.asOfDate = document.getElementById('asOfDateInput').value;
        saveSettings();
        closeAllModals();
        renderGrid();
        renderBalanceToday();
        renderYearEndNetWorth();
        showToast('Starting balance updated');
    }

    // --- Quick Filter ---

    function openQuickFilterModal() {
        document.getElementById('filterSearchInput').value = '';
        document.getElementById('filterIncludeArchived').checked = false;
        document.getElementById('filterResultsBody').innerHTML = '';
        document.getElementById('filterSummary').innerHTML = '';
        openModal('quickFilterModal');
    }

    function handleFilterSearch() {
        const query = document.getElementById('filterSearchInput').value.toLowerCase().trim();
        const includeArchived = document.getElementById('filterIncludeArchived').checked;
        if (!query) {
            document.getElementById('filterResultsBody').innerHTML = '';
            document.getElementById('filterSummary').innerHTML = '';
            return;
        }
        const results = getYearTransactions().filter(tx => {
            if (tx.archived && !includeArchived) return false;
            return (tx.item || '').toLowerCase().includes(query) ||
                   (tx.description || '').toLowerCase().includes(query) ||
                   (tx.category || '').toLowerCase().includes(query);
        });
        const totalIncome = results.filter(t => t.type === 'Income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpense = results.filter(t => t.type === 'Expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const netTotal = totalIncome - totalExpense;
        document.getElementById('filterSummary').innerHTML =
            '<div class="filter-summary-item"><span class="filter-summary-label">Results</span><span class="filter-summary-value">' + results.length + '</span></div>' +
            '<div class="filter-summary-item"><span class="filter-summary-label">Total Income</span><span class="filter-summary-value positive">' + formatCurrency(totalIncome) + '</span></div>' +
            '<div class="filter-summary-item"><span class="filter-summary-label">Total Expense</span><span class="filter-summary-value negative">' + formatCurrency(totalExpense) + '</span></div>' +
            '<div class="filter-summary-item"><span class="filter-summary-label">Net</span><span class="filter-summary-value ' + (netTotal >= 0 ? 'positive' : 'negative') + '">' + formatCurrency(netTotal) + '</span></div>';
        document.getElementById('filterResultsBody').innerHTML = results.map(tx => {
            const isPaid = tx.paid ? true : false;
            return '<tr><td>' + formatDate(tx.date) + '</td><td>' + escapeHtml(tx.item) + '</td><td>' + escapeHtml(tx.description) + '</td><td>' + escapeHtml(tx.category) + '</td><td class="type-' + tx.type.toLowerCase() + '">' + tx.type + '</td><td style="text-align: right;">' + formatCurrency(tx.amount) + '</td><td><span class="paid-status ' + (isPaid ? 'is-paid' : 'is-unpaid') + '">' + (isPaid ? 'Paid' : 'Unpaid') + '</span></td></tr>';
        }).join('');
    }

    // --- Debts ---

    function openDebtsModal() {
        const debts = getDebtsArray();
        document.getElementById('showDebtColumnsCheck').checked = state.debtsExpanded;
        renderDebtsList(debts);
        openModal('debtsModal');
    }

    function renderDebtsList(debts) {
        const container = document.getElementById('debtsList');
        if (debts.length === 0) {
            container.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">No debts added. Click "Add Debt" to create one.</p>';
            return;
        }
        container.innerHTML = debts.map((debt, index) =>
            '<div class="debt-item" data-index="' + index + '" data-debt-id="' + debt.id + '">' +
                '<div class="form-group"><label>Debt Name</label><input type="text" class="form-input debt-name" value="' + escapeHtml(debt.name) + '" placeholder="e.g., Credit Card"></div>' +
                '<div class="form-group"><label>Amount (£)</label><input type="number" class="form-input debt-amount" value="' + debt.amount + '" step="0.01"></div>' +
                '<button class="debt-item-remove" data-index="' + index + '" title="Remove debt"><i data-lucide="trash-2" class="icon"></i></button>' +
            '</div>'
        ).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function handleAddDebt() {
        const debts = getDebtsArray();
        debts.push({ id: 'debt_' + Date.now(), name: 'New Debt', amount: 0, keyword: 'new debt' });
        renderDebtsList(debts);
    }

    function handleRemoveDebt(e) {
        const index = parseInt(e.target.closest('[data-index]').dataset.index);
        const debts = getDebtsArray();
        debts.splice(index, 1);
        renderDebtsList(debts);
    }

    function saveDebts() {
        const debtItems = document.querySelectorAll('.debt-item');
        const debts = [];
        debtItems.forEach((item, index) => {
            const name = item.querySelector('.debt-name').value.trim();
            const amount = parseFloat(item.querySelector('.debt-amount').value) || 0;
            const existingId = item.dataset.debtId;
            if (name) debts.push({ id: existingId || 'debt_' + Date.now() + '_' + index, name: name, amount: amount, keyword: name.toLowerCase() });
        });
        state.settings.debts = JSON.stringify(debts);
        state.debtsExpanded = document.getElementById('showDebtColumnsCheck').checked;
        saveSettings();
        closeAllModals();
        renderDebtHeaders();
        renderGrid();
        renderYearEndNetWorth();
        showToast('Debts updated');
    }

    // --- Hide / Archive ---

    function openHideArchiveModal() {
        const hideMonth = state.hiddenMonths.length > 0 ? Math.min(...state.hiddenMonths) : '';
        document.getElementById('hideBeforeMonth').value = hideMonth;
        openModal('hideArchiveModal');
    }

    function applyHideMonths() {
        const hideBeforeMonth = parseInt(document.getElementById('hideBeforeMonth').value);
        if (hideBeforeMonth) {
            state.hiddenMonths = [];
            for (let m = 1; m < hideBeforeMonth; m++) state.hiddenMonths.push(m);
        } else {
            state.hiddenMonths = [];
        }
        saveSettings();
        closeAllModals();
        renderGrid();
        showToast('View updated');
    }

    function archiveBeforeMonth() {
        const hideBeforeMonth = parseInt(document.getElementById('hideBeforeMonth').value);
        if (!hideBeforeMonth) { showToast('Please select a month first', 'error'); return; }
        const yearTxs = getYearTransactions();
        let count = 0;
        yearTxs.forEach(tx => {
            const txMonth = new Date(tx.date).getMonth() + 1;
            if (txMonth < hideBeforeMonth && !tx.archived) { tx.archived = 1; count++; }
        });
        saveToStorage();
        renderGrid();
        showToast(count + ' rows archived');
    }

    function unarchiveAll() {
        const yearTxs = getYearTransactions();
        let count = 0;
        yearTxs.forEach(tx => { if (tx.archived) { tx.archived = 0; count++; } });
        saveToStorage();
        renderGrid();
        showToast(count + ' rows restored');
    }

    // --- New Year ---

    function openNewYearModal() {
        openModal('newYearModal');
    }

    function handleCreateNewYear() {
        const newYear = (parseInt(state.currentYear) + 1).toString();
        const existing = state.transactions.filter(tx => tx.date.startsWith(newYear));
        if (existing.length > 0) {
            showToast(newYear + ' already has transactions', 'error');
            closeAllModals();
            return;
        }

        // Copy recurring transactions into new year
        const yearTxs = getYearTransactions();
        const itemCounts = {};
        yearTxs.forEach(tx => { itemCounts[tx.item] = (itemCounts[tx.item] || 0) + 1; });

        const recurringItems = Object.keys(itemCounts).filter(item => itemCounts[item] > 1);
        const toAdd = [];

        recurringItems.forEach(item => {
            const instances = yearTxs.filter(tx => tx.item === item);
            instances.forEach(tx => {
                const oldDate = new Date(tx.date);
                const newDate = new Date(oldDate);
                newDate.setFullYear(parseInt(newYear));
                toAdd.push({
                    ...tx,
                    id: generateId(),
                    date: newDate.toISOString().split('T')[0],
                    paid: 0,
                    archived: 0
                });
            });
        });

        toAdd.forEach(tx => state.transactions.push(tx));
        state.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        state.currentYear = newYear;
        saveSettings();
        closeAllModals();
        renderYearSelector();
        renderBalanceToday();
        renderYearEndNetWorth();
        renderGrid();
        showToast('Created ' + toAdd.length + ' transactions for ' + newYear);
    }

    // --- Recurring Costs ---

    function openRecurringCostsModal() {
        const recurringData = analyzeRecurringCosts();
        renderRecurringCostsTable(recurringData);
        renderRecurringCostsChart(recurringData);
        openModal('recurringCostsModal');
    }

    function analyzeRecurringCosts() {
        const itemGroups = {};
        getYearTransactions().forEach(tx => {
            if (!itemGroups[tx.item]) itemGroups[tx.item] = [];
            itemGroups[tx.item].push(tx);
        });
        const recurringData = [];
        Object.entries(itemGroups).forEach(([item, txs]) => {
            if (txs.length >= 2) {
                const total = txs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
                recurringData.push({ item: item, count: txs.length, avgAmount: total / txs.length, total: total, type: txs[0].type });
            }
        });
        recurringData.sort((a, b) => b.total - a.total);
        return recurringData;
    }

    function renderRecurringCostsTable(data) {
        const tbody = document.getElementById('recurringCostsTableBody');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: rgba(255,255,255,0.5);">No recurring transactions found</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(item =>
            '<tr><td>' + escapeHtml(item.item) + '</td><td>' + item.count + 'x per year</td><td>' + formatCurrency(item.avgAmount) + '</td><td style="font-weight: 600;">' + formatCurrency(item.total) + '</td></tr>'
        ).join('');
    }

    function renderRecurringCostsChart(data) {
        const container = document.getElementById('recurringCostsChart');
        if (data.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 4rem; color: rgba(255,255,255,0.5);">No recurring transactions to display</div>';
            return;
        }
        const topItems = data.slice(0, 10);
        container.innerHTML = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">' +
            topItems.map(item => {
                const percentage = (item.total / data[0].total) * 100;
                const color = item.type === 'Income' ? '#10b981' : '#ef4444';
                return '<div style="display: flex; align-items: center; gap: 1rem;">' +
                    '<div style="min-width: 200px; font-size: 0.875rem;">' + escapeHtml(item.item) + '</div>' +
                    '<div style="flex: 1; background: rgba(255,255,255,0.1); border-radius: 0.25rem; height: 24px; overflow: hidden;">' +
                        '<div style="background: ' + color + '; height: 100%; width: ' + percentage + '%; transition: width 0.3s;"></div>' +
                    '</div>' +
                    '<div style="min-width: 100px; text-align: right; font-weight: 600;">' + formatCurrency(item.total) + '</div>' +
                '</div>';
            }).join('') +
        '</div>';
    }

    // --- Calculator ---

    let calcState = {
        currentValue: '0', previousValue: null, operation: null, shouldResetDisplay: false
    };

    function openCalculatorModal() {
        const scratchpad = state.settings.scratchpad || '';
        document.getElementById('scratchpad').value = scratchpad;
        calcState = { currentValue: '0', previousValue: null, operation: null, shouldResetDisplay: false };
        updateCalcDisplay();
        document.addEventListener('keydown', handleCalcKeyboard);
        openModal('calculatorModal');
    }

    function updateCalcDisplay() {
        document.getElementById('calcDisplay').textContent = calcState.currentValue;
    }

    function handleCalcButton(action) {
        if (!isNaN(action) || action === '.') handleNumberInput(action);
        else if (['+', '-', '*', '/'].includes(action)) handleOperation(action);
        else if (action === '=') handleEquals();
        else if (action === 'clear') handleClear();
        else if (action === 'backspace') handleBackspace();
        else if (action === 'percent') handlePercent();
        updateCalcDisplay();
    }

    function handleCalcKeyboard(e) {
        const calcModal = document.getElementById('calculatorModal');
        if (!calcModal || !calcModal.classList.contains('active')) return;
        const scratchpad = document.getElementById('scratchpad');
        if (document.activeElement === scratchpad) return;
        const key = e.key;
        if (/^[0-9.]$/.test(key)) { e.preventDefault(); handleCalcButton(key); }
        else if (['+', '-', '*', '/'].includes(key)) { e.preventDefault(); handleCalcButton(key); }
        else if (key === 'Enter' || key === '=') { e.preventDefault(); handleCalcButton('='); }
        else if (key === 'Backspace') { e.preventDefault(); handleCalcButton('backspace'); }
        else if (key === 'Escape' || key.toLowerCase() === 'c') { e.preventDefault(); handleCalcButton('clear'); }
        else if (key === '%') { e.preventDefault(); handleCalcButton('percent'); }
    }

    function handleNumberInput(num) {
        if (calcState.shouldResetDisplay) { calcState.currentValue = num; calcState.shouldResetDisplay = false; }
        else if (calcState.currentValue === '0' && num !== '.') { calcState.currentValue = num; }
        else if (num === '.' && calcState.currentValue.includes('.')) { return; }
        else { calcState.currentValue += num; }
    }

    function handleOperation(op) {
        if (calcState.previousValue !== null && !calcState.shouldResetDisplay) handleEquals();
        calcState.previousValue = calcState.currentValue;
        calcState.operation = op;
        calcState.shouldResetDisplay = true;
    }

    function handleEquals() {
        if (calcState.operation === null || calcState.previousValue === null) return;
        const prev = parseFloat(calcState.previousValue);
        const current = parseFloat(calcState.currentValue);
        let result;
        switch (calcState.operation) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '*': result = prev * current; break;
            case '/': result = prev / current; break;
        }
        calcState.currentValue = String(Math.round(result * 100000000) / 100000000);
        calcState.operation = null;
        calcState.previousValue = null;
        calcState.shouldResetDisplay = true;
    }

    function handleClear() {
        calcState.currentValue = '0';
        calcState.previousValue = null;
        calcState.operation = null;
        calcState.shouldResetDisplay = false;
    }

    function handleBackspace() {
        calcState.currentValue = calcState.currentValue.length > 1 ? calcState.currentValue.slice(0, -1) : '0';
    }

    function handlePercent() {
        calcState.currentValue = String(parseFloat(calcState.currentValue) / 100);
    }

    function saveScratchpad() {
        const scratchpad = document.getElementById('scratchpad').value;
        state.settings.scratchpad = scratchpad;
        saveSettings();
    }

    function clearScratchpad() {
        document.getElementById('scratchpad').value = '';
        saveScratchpad();
    }

    // --- Clear All ---

    function handleClearAll() {
        if (!confirm('Clear all data and reset to a blank tracker?\n\nThis cannot be undone.')) return;
        localStorage.removeItem(STORAGE_KEY);
        state.transactions = [];
        state.settings = {};
        state.currentYear = new Date().getFullYear().toString();
        state.hiddenMonths = [];
        state.debtsExpanded = false;
        state.undoStack = [];
        state.redoStack = [];
        saveSettings();
        renderYearSelector();
        renderBalanceToday();
        renderYearEndNetWorth();
        renderDebtHeaders();
        renderGrid();
        updateUndoRedoButtons();
        showToast('All data cleared — ready to start fresh');
    }

    // --- Keyboard shortcuts ---

    function handleKeydown(e) {
        if (e.key === 'Escape') {
            if (state.editingCell) cancelEdit();
            else closeAllModals();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    }

    // --- Init ---

    function init() {
        initElements();

        loadData();

        renderYearSelector();
        renderBalanceToday();
        renderYearEndNetWorth();
        renderDebtHeaders();
        renderGrid();
        updateUndoRedoButtons();

        elements.sidebarToggle.addEventListener('click', handleSidebarToggle);
        elements.yearSelect.addEventListener('change', handleYearChange);
        elements.goToTodayBtn.addEventListener('click', handleGoToToday);
        elements.addRowBtn.addEventListener('click', handleAddRow);
        elements.addRecurringBtn.addEventListener('click', openAddRecurringModal);
        document.getElementById('createRecurringBtn').addEventListener('click', saveRecurringTransactions);
        elements.newYearBtn.addEventListener('click', openNewYearModal);
        elements.importBtn.addEventListener('click', openImportModal);
        elements.exportBtn.addEventListener('click', handleExport);
        if (elements.clearAllBtn) elements.clearAllBtn.addEventListener('click', handleClearAll);
        elements.undoBtn.addEventListener('click', handleUndo);
        elements.redoBtn.addEventListener('click', handleRedo);

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', handleNavItemClick);
        });

        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', closeAllModals);
        });
        elements.modalBackdrop.addEventListener('click', closeAllModals);

        document.getElementById('saveStartingBalanceBtn').addEventListener('click', saveStartingBalance);
        document.getElementById('saveDebtsBtn').addEventListener('click', saveDebts);
        document.getElementById('addDebtBtn').addEventListener('click', handleAddDebt);
        document.getElementById('debtsList').addEventListener('click', (e) => {
            if (e.target.closest('.debt-item-remove')) handleRemoveDebt(e);
        });
        document.getElementById('applyHideBtn').addEventListener('click', applyHideMonths);
        document.getElementById('archiveBeforeMonthBtn').addEventListener('click', archiveBeforeMonth);
        document.getElementById('unarchiveAllBtn').addEventListener('click', unarchiveAll);

        document.getElementById('editThisOnlyBtn').addEventListener('click', handleEditThisOnly);
        document.getElementById('editAllMatchingBtn').addEventListener('click', handleEditAllMatching);
        document.getElementById('editFutureBtn').addEventListener('click', handleEditFuture);

        document.getElementById('deleteThisOnlyBtn').addEventListener('click', handleDeleteThisOnly);
        document.getElementById('deleteAllRecurringBtn').addEventListener('click', handleDeleteAllRecurring);

        document.getElementById('filterSearchInput').addEventListener('input', handleFilterSearch);
        document.getElementById('filterIncludeArchived').addEventListener('change', handleFilterSearch);

        // Import file listener
        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) importFileInput.addEventListener('change', handleImportFile);

        // New year modal
        const createNewYearBtn = document.getElementById('createNewYearBtn');
        if (createNewYearBtn) createNewYearBtn.addEventListener('click', handleCreateNewYear);

        elements.gridBody.addEventListener('click', handleCellClick);
        elements.gridBody.addEventListener('click', handleRowAction);

        document.addEventListener('keydown', handleKeydown);

        // Calculator
        const calcGrid = document.querySelector('.calculator-grid');
        if (calcGrid) {
            calcGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('.calc-btn');
                if (btn) handleCalcButton(btn.dataset.action);
            });
        }

        const scratchpad = document.getElementById('scratchpad');
        if (scratchpad) scratchpad.addEventListener('blur', saveScratchpad);

        const clearScratchBtn = document.getElementById('clearScratchpadBtn');
        if (clearScratchBtn) clearScratchBtn.addEventListener('click', clearScratchpad);

        if (typeof lucide !== 'undefined') lucide.createIcons();
        console.log('Budget Tracker initialised — localStorage mode');
    }

    document.addEventListener('DOMContentLoaded', init);
})();
