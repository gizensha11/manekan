import React, { useState, useEffect, useMemo } from "react";
import {
  Home, CreditCard, BookOpen, Wallet, Plus, X, Pencil, Trash2,
  AlertTriangle, ChevronRight, ChevronLeft, ArrowDownCircle, ArrowUpCircle, Check
} from "lucide-react";

/* ---------- helpers ---------- */

const pad2 = (n) => String(n).padStart(2, "0");
const monthKeyOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const addMonthsToKey = (key, n) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return monthKeyOf(d);
};
const dateForMonthDay = (key, day) => {
  const [y, m] = key.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  return new Date(y, m - 1, Math.min(day, daysInMonth));
};
const computePaymentMonth = (usageDateStr, closingDay) => {
  const d = new Date(usageDateStr + "T00:00:00");
  const day = d.getDate();
  let closingKey = monthKeyOf(d);
  if (day > closingDay) closingKey = addMonthsToKey(closingKey, 1);
  return addMonthsToKey(closingKey, 1);
};
const fmtDate = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
const fmtDateFull = (d) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
const yen = (n) => `${n < 0 ? "-" : ""}¥${Math.abs(Math.round(n)).toLocaleString("ja-JP")}`;
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const CARD_COLORS = ["#2F6156", "#B8862B", "#3E4C7D", "#8A4B3B", "#6B4C6B", "#3E6B7D"];

const INITIAL = {
  minSecure: 20000,
  thresholdLow: 15000,
  thresholdMid: 60000,
  accounts: [
    { id: "acc-yucho", name: "ゆうちょ銀行", balance: 80000 },
    { id: "acc-smbc", name: "三井住友銀行", balance: 40000 },
    { id: "acc-rakuten", name: "楽天銀行", balance: 20000 },
    { id: "acc-paypay", name: "PayPay銀行", balance: 10000 },
  ],
  cards: [
    { id: "card-smbc", name: "三井住友カード", closingDay: 15, paymentDay: 10, accountId: "acc-yucho", color: CARD_COLORS[0] },
    { id: "card-paypay", name: "PayPayカード", closingDay: 10, paymentDay: 27, accountId: "acc-yucho", color: CARD_COLORS[1] },
    { id: "card-suica", name: "ビックカメラSuicaカード", closingDay: 20, paymentDay: 4, accountId: "acc-smbc", color: CARD_COLORS[2] },
    { id: "card-jal", name: "JALカード", closingDay: 5, paymentDay: 2, accountId: "acc-rakuten", color: CARD_COLORS[3] },
    { id: "card-rakuten", name: "楽天カード", closingDay: 31, paymentDay: 27, accountId: "acc-yucho", color: CARD_COLORS[4] },
  ],
  transactions: [
    { id: uid(), cardId: "card-rakuten", date: "2026-08-20", amount: 3200, memo: "Amazon", paymentMonth: computePaymentMonth("2026-08-20", 31), paid: false, paidDate: null },
    { id: uid(), cardId: "card-rakuten", date: "2026-09-01", amount: 1200, memo: "コンビニ", paymentMonth: computePaymentMonth("2026-09-01", 31), paid: false, paidDate: null },
    { id: uid(), cardId: "card-rakuten", date: "2026-09-03", amount: 8600, memo: "楽天市場", paymentMonth: computePaymentMonth("2026-09-03", 31), paid: false, paidDate: null },
    { id: uid(), cardId: "card-smbc", date: "2026-08-20", amount: 18000, memo: "家電量販店", paymentMonth: computePaymentMonth("2026-08-20", 15), paid: false, paidDate: null },
    { id: uid(), cardId: "card-smbc", date: "2026-09-04", amount: 5000, memo: "外食", paymentMonth: computePaymentMonth("2026-09-04", 15), paid: false, paidDate: null },
    { id: uid(), cardId: "card-paypay", date: "2026-09-02", amount: 4500, memo: "スーパー", paymentMonth: computePaymentMonth("2026-09-02", 10), paid: false, paidDate: null },
  ],
  accountLogs: [
    { id: uid(), accountId: "acc-yucho", type: "deposit", amount: 50000, date: "2026-08-25", memo: "給与" },
    { id: uid(), accountId: "acc-yucho", type: "withdraw", amount: 3000, date: "2026-08-28", memo: "ATM出金" },
  ],
};

/* ---------- small UI atoms ---------- */

function Modal({ title, onClose, children }) {
  return (
    <div className="mk-overlay" onClick={onClose}>
      <div className="mk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mk-modal-head">
          <span>{title}</span>
          <button className="mk-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mk-modal-body">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="mk-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }) {
  return (
    <span className="mk-badge" style={{ "--badge-color": status.color }}>
      <i /> {status.label}
    </span>
  );
}

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div className="mk-confirm">
      <span>削除しますか？</span>
      <button className="mk-mini-btn mk-mini-danger" onClick={onConfirm}><Check size={14} /> 削除</button>
      <button className="mk-mini-btn" onClick={onCancel}>やめる</button>
    </div>
  );
}

/* ---------- wallet visual ---------- */

function walletLevel(free, low, mid) {
  if (free < 0) return -1;
  if (free < low) return 1;
  if (free < mid) return 2;
  if (free < mid * 2.5) return 3;
  return 4;
}

function WalletVisual({ free, low, mid, size = "large" }) {
  const level = walletLevel(free, low, mid);
  const bills = level > 0 ? level * 2 : 0;
  const coins = level > 0 ? level : 0;
  return (
    <div className={`mk-wallet mk-wallet-${size} ${level < 0 ? "mk-wallet-danger" : level === 0 ? "mk-wallet-empty" : ""}`}>
      <div className="mk-wallet-pocket">
        <div className="mk-wallet-contents">
          {Array.from({ length: bills }).map((_, i) => (
            <div key={"b" + i} className="mk-bill" style={{ "--i": i }} />
          ))}
          <div className="mk-coins-row">
            {Array.from({ length: coins }).map((_, i) => (
              <div key={"c" + i} className="mk-coin" style={{ "--i": i }} />
            ))}
          </div>
        </div>
        {level <= 0 && <div className="mk-wallet-flap" />}
        {level < 0 && <AlertTriangle className="mk-wallet-warn" size={size === "large" ? 30 : 20} />}
      </div>
    </div>
  );
}

/* ---------- forms ---------- */

function AccountForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [balance, setBalance] = useState(initial?.balance ?? 0);
  return (
    <div className="mk-form">
      <Field label="口座名">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例）ゆうちょ銀行" />
      </Field>
      <Field label="現在残高">
        <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} />
      </Field>
      <div className="mk-form-actions">
        <button className="mk-btn mk-btn-ghost" onClick={onCancel}>キャンセル</button>
        <button
          className="mk-btn mk-btn-primary"
          disabled={!name.trim()}
          onClick={() => onSave({ id: initial?.id ?? uid(), name: name.trim(), balance: Number(balance) || 0 })}
        >
          {initial ? "保存" : "追加"}
        </button>
      </div>
    </div>
  );
}

function CardForm({ initial, accounts, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [closingDay, setClosingDay] = useState(initial?.closingDay ?? 15);
  const [paymentDay, setPaymentDay] = useState(initial?.paymentDay ?? 10);
  const [accountId, setAccountId] = useState(initial?.accountId ?? accounts[0]?.id ?? "");
  const [color, setColor] = useState(initial?.color ?? CARD_COLORS[0]);
  return (
    <div className="mk-form">
      <Field label="カード名">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例）楽天カード" />
      </Field>
      <div className="mk-form-row">
        <Field label="締め日">
          <input type="number" min={1} max={31} value={closingDay} onChange={(e) => setClosingDay(Number(e.target.value))} />
        </Field>
        <Field label="支払日">
          <input type="number" min={1} max={31} value={paymentDay} onChange={(e) => setPaymentDay(Number(e.target.value))} />
        </Field>
      </div>
      <Field label="引落口座">
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.length === 0 && <option value="">口座を先に登録してください</option>}
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label="カードカラー">
        <div className="mk-color-row">
          {CARD_COLORS.map((c) => (
            <button
              key={c}
              className={`mk-color-dot ${color === c ? "mk-color-dot-active" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </Field>
      <div className="mk-form-actions">
        <button className="mk-btn mk-btn-ghost" onClick={onCancel}>キャンセル</button>
        <button
          className="mk-btn mk-btn-primary"
          disabled={!name.trim() || !accountId}
          onClick={() => onSave({
            id: initial?.id ?? uid(), name: name.trim(),
            closingDay: Math.min(31, Math.max(1, Number(closingDay) || 1)),
            paymentDay: Math.min(31, Math.max(1, Number(paymentDay) || 1)),
            accountId, color,
          })}
        >
          {initial ? "保存" : "追加"}
        </button>
      </div>
    </div>
  );
}

function TransactionForm({ cards, presetCardId, onSave, onCancel }) {
  const [cardId, setCardId] = useState(presetCardId ?? cards[0]?.id ?? "");
  const [date, setDate] = useState(todayStr());
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const card = cards.find((c) => c.id === cardId);
  const autoMonth = card ? computePaymentMonth(date, card.closingDay) : "";
  const [paymentMonth, setPaymentMonth] = useState(autoMonth);
  const [monthTouched, setMonthTouched] = useState(false);
  useEffect(() => { if (!monthTouched) setPaymentMonth(autoMonth); }, [autoMonth, monthTouched]);
  return (
    <div className="mk-form">
      <Field label="カード">
        <select value={cardId} onChange={(e) => setCardId(e.target.value)}>
          {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div className="mk-form-row">
        <Field label="利用日">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="金額">
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>
      </div>
      <Field label="店名・メモ">
        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="任意" />
      </Field>
      <Field label="支払い予定月（自動判定・変更可）">
        <input
          type="month"
          value={paymentMonth}
          onChange={(e) => { setPaymentMonth(e.target.value); setMonthTouched(true); }}
        />
      </Field>
      <div className="mk-form-actions">
        <button className="mk-btn mk-btn-ghost" onClick={onCancel}>キャンセル</button>
        <button
          className="mk-btn mk-btn-primary"
          disabled={!cardId || !(Number(amount) > 0)}
          onClick={() => onSave({ 
            id: uid(), cardId, date, amount: Number(amount), memo: memo.trim(), paymentMonth,
            paid: false, paidDate: null
          })}
        >
          登録
        </button>
      </div>
    </div>
  );
}

function AccountLogForm({ onSave, onCancel }) {
  const [type, setType] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  return (
    <div className="mk-form">
      <div className="mk-toggle-row">
        <button className={`mk-toggle ${type === "deposit" ? "mk-toggle-active" : ""}`} onClick={() => setType("deposit")}>
          <ArrowDownCircle size={16} /> 入金
        </button>
        <button className={`mk-toggle ${type === "withdraw" ? "mk-toggle-active" : ""}`} onClick={() => setType("withdraw")}>
          <ArrowUpCircle size={16} /> 出金
        </button>
      </div>
      <Field label="金額">
        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      </Field>
      <Field label="メモ">
        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="任意" />
      </Field>
      <div className="mk-form-actions">
        <button className="mk-btn mk-btn-ghost" onClick={onCancel}>キャンセル</button>
        <button
          className="mk-btn mk-btn-primary"
          disabled={!(Number(amount) > 0)}
          onClick={() => onSave({ id: uid(), type, amount: Number(amount), memo: memo.trim(), date: todayStr() })}
        >
          記録する
        </button>
      </div>
    </div>
  );
}

/* ---------- main app ---------- */

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [data, setData] = useState(INITIAL);
  const [modal, setModal] = useState(null); // {type, payload}
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [confirming, setConfirming] = useState(null); // id of item pending delete confirm

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("manekan-data", false);
        if (res && res.value) setData(JSON.parse(res.value));
      } catch (e) {
        // no saved data yet — keep INITIAL
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set("manekan-data", JSON.stringify(data), false);
      } catch (e) {
        console.error("保存に失敗しました", e);
      }
    })();
  }, [data, loaded]);

  const { accounts, cards, transactions, accountLogs, minSecure, thresholdLow, thresholdMid } = data;
  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  /* ----- derived data ----- */

  const cardsWithSchedule = useMemo(() => {
    return cards.map((card) => {
      const txs = transactions.filter((t) => t.cardId === card.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      const unpaidTxs = txs.filter((t) => !t.paid);
      
      const byMonth = {};
      unpaidTxs.forEach((t) => { byMonth[t.paymentMonth] = (byMonth[t.paymentMonth] || 0) + t.amount; });
      const schedule = Object.entries(byMonth)
        .map(([month, amount]) => ({ month, amount, date: dateForMonthDay(month, card.paymentDay) }))
        .sort((a, b) => a.date - b.date);
        
      const outstanding = unpaidTxs.reduce((s, t) => s + t.amount, 0);
      const next = schedule.find((s) => s.amount > 0) || null;
      
      return { ...card, txs, schedule, outstanding, next };
    });
  }, [cards, transactions]);

  const totalAccountBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalFuturePayments = cardsWithSchedule.reduce((s, c) => s + c.outstanding, 0);
  const freeMoney = totalAccountBalance - totalFuturePayments - minSecure;
  
  const status = freeMoney < 0
    ? { label: "マイナス", color: "var(--danger)" }
    : freeMoney < thresholdLow
    ? { label: "少ない", color: "var(--alert)" }
    : freeMoney < thresholdMid
    ? { label: "注意", color: "var(--coin)" }
    : { label: "余裕あり", color: "var(--bill)" };

  const nextPaymentOverall = useMemo(() => {
    const today = startOfToday();
    let best = null;
    cardsWithSchedule.forEach((c) => {
      c.schedule.forEach((s) => {
        if (s.amount > 0 && (!best || s.date < best.date)) {
          best = { date: s.date, amount: s.amount, cardName: c.name, accountId: c.accountId };
        }
      });
    });
    return best ? { ...best, overdue: best.date < today } : null;
  }, [cardsWithSchedule]);

  const accountViews = useMemo(() => {
    const today = startOfToday();
    return accounts.map((acc) => {
      const linkedCards = cardsWithSchedule.filter((c) => c.accountId === acc.id);
      const upcoming = linkedCards
        .flatMap((c) => c.schedule.filter((s) => s.amount > 0).map((s) => ({ ...s, cardName: c.name, overdue: s.date < today })))
        .sort((a, b) => a.date - b.date);
      
      let running = acc.balance;
      let shortfall = null;
      for (const p of upcoming) {
        running -= p.amount;
        if (running < 0 && !shortfall) shortfall = { date: p.date, needed: -running };
      }
      const logs = accountLogs.filter((l) => l.accountId === acc.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      return { ...acc, upcoming, shortfall, logs };
    });
  }, [accounts, cardsWithSchedule, accountLogs]);

  const fundsTransition = useMemo(() => {
    const today = startOfToday();
    let overdueAmount = 0;
    const byDate = {};

    cardsWithSchedule.forEach((c) => {
      c.schedule.forEach((s) => {
        if (s.amount > 0) {
          if (s.date < today) {
            overdueAmount += s.amount;
          } else {
            const key = s.date.getTime();
            byDate[key] = (byDate[key] || 0) + s.amount;
          }
        }
      });
    });

    const points = Object.entries(byDate)
      .map(([t, amount]) => ({ date: new Date(Number(t)), amount }))
      .sort((a, b) => a.date - b.date);

    let running = totalAccountBalance - minSecure;
    const rows = [{ label: "現在", amount: running }];

    if (overdueAmount > 0) {
      running -= overdueAmount;
      rows.push({ label: "期限超過", amount: running });
    }

    points.forEach((p) => {
      running -= p.amount;
      rows.push({ label: fmtDate(p.date), amount: running });
    });

    return rows.slice(0, 6);
  }, [cardsWithSchedule, totalAccountBalance, minSecure]);

  const anyShortfall = accountViews.some((a) => a.shortfall);

  /* ----- mutation handlers ----- */

  const saveAccount = (acc) => {
    update({ accounts: accounts.some((a) => a.id === acc.id) ? accounts.map((a) => a.id === acc.id ? acc : a) : [...accounts, acc] });
    setModal(null);
  };
  const deleteAccount = (id) => {
    if (cards.some((c) => c.accountId === id)) { setConfirming(null); return; }
    update({ accounts: accounts.filter((a) => a.id !== id), accountLogs: accountLogs.filter((l) => l.accountId !== id) });
    setConfirming(null);
  };
  const saveCard = (card) => {
    update({ cards: cards.some((c) => c.id === card.id) ? cards.map((c) => c.id === card.id ? card : c) : [...cards, card] });
    setModal(null);
  };
  const deleteCard = (id) => {
    update({ cards: cards.filter((c) => c.id !== id), transactions: transactions.filter((t) => t.cardId !== id) });
    setConfirming(null);
    if (selectedCardId === id) setSelectedCardId(null);
  };
  const saveTransaction = (tx) => {
    update({ transactions: [...transactions, tx] });
    setModal(null);
  };
  const deleteTransaction = (id) => {
    update({ transactions: transactions.filter((t) => t.id !== id) });
    setConfirming(null);
  };
  const addAccountLog = (accountId, log) => {
    const delta = log.type === "deposit" ? log.amount : -log.amount;
    update({
      accounts: accounts.map((a) => a.id === accountId ? { ...a, balance: a.balance + delta } : a),
      accountLogs: [...accountLogs, { ...log, accountId }],
    });
    setModal(null);
  };

  const markAsPaid = (cardId, paymentMonth) => {
    update({
      transactions: transactions.map((t) =>
        t.cardId === cardId && t.paymentMonth === paymentMonth && !t.paid
          ? { ...t, paid: true, paidDate: todayStr() }
          : t
      ),
    });
  };

  if (!loaded) {
    return <div className="mk-loading">読み込み中…</div>;
  }

  const selectedCard = selectedCardId ? cardsWithSchedule.find((c) => c.id === selectedCardId) : null;

  return (
    <div className="mk-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');
        .mk-root {
          --paper: #EEEAE1;
          --surface: #FFFFFF;
          --ink: #21303A;
          --ink-soft: #64727A;
          --line: #DBD3C4;
          --bill: #2F6156;
          --bill-soft: #DCE8E1;
          --coin: #B8862B;
          --coin-soft: #F1E4C6;
          --danger: #A6423A;
          --danger-soft: #F2DFDB;
          --alert: #C1722B;
          --indigo: #3E4C7D;
          --font-display: 'Shippori Mincho', serif;
          --font-body: 'Zen Kaku Gothic New', sans-serif;
          font-family: var(--font-body);
          color: var(--ink);
          background: var(--paper);
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          position: relative;
          padding-bottom: 84px;
          box-sizing: border-box;
        }
        .mk-root * { box-sizing: border-box; }
        .mk-loading { padding: 40px; text-align: center; font-family: var(--font-body); color: var(--ink-soft); }

        .mk-header {
          padding: 22px 20px 8px;
        }
        .mk-header h1 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 22px;
          margin: 0;
          letter-spacing: 0.08em;
        }
        .mk-screen { padding: 0 16px 24px; }

        .mk-hero {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 20px 20px 16px;
          margin: 10px 0 14px;
        }
        .mk-hero-top { display: flex; align-items: center; justify-content: space-between; }
        .mk-hero-label { font-size: 13px; color: var(--ink-soft); display: flex; align-items: center; gap: 6px; }
        .mk-hero-amount {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 40px;
          line-height: 1.15;
          margin: 6px 0 2px;
          letter-spacing: 0.01em;
        }
        .mk-hero-sub { font-size: 12px; color: var(--ink-soft); margin-bottom: 10px; }
        .mk-hero-row { display: flex; align-items: center; gap: 14px; }

        .mk-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; padding: 4px 10px; border-radius: 999px;
          border: 1px solid var(--badge-color); color: var(--badge-color);
          white-space: nowrap;
        }
        .mk-badge i { width: 6px; height: 6px; border-radius: 50%; background: var(--badge-color); display: inline-block; }

        .mk-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .mk-stat { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; }
        .mk-stat-label { font-size: 11.5px; color: var(--ink-soft); margin-bottom: 4px; }
        .mk-stat-value { font-family: var(--font-display); font-weight: 700; font-size: 19px; }
        .mk-stat-wide { grid-column: 1 / -1; }

        .mk-section-title { font-size: 13px; color: var(--ink-soft); margin: 18px 2px 8px; letter-spacing: 0.02em; }

        .mk-next-payment {
          background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
          padding: 14px; display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
        }
        .mk-next-date {
          font-family: var(--font-display); font-weight: 700; font-size: 20px;
          background: var(--paper); border-radius: 10px; padding: 6px 10px; min-width: 52px; text-align: center;
        }
        .mk-next-info { flex: 1; }
        .mk-next-card { font-size: 13px; color: var(--ink-soft); }
        .mk-next-amount { font-weight: 700; font-size: 16px; }
        .mk-next-account { font-size: 11.5px; color: var(--ink-soft); }
        .mk-next-date.overdue { color: var(--danger); border: 1px solid var(--danger); }
        .mk-overdue-tag {
          display: inline-block; font-size: 10.5px; color: var(--danger); border: 1px solid var(--danger);
          border-radius: 999px; padding: 1px 7px; margin-right: 6px;
        }

        .mk-warn-banner {
          background: var(--danger-soft); border: 1px solid var(--danger);
          color: var(--danger); border-radius: 14px; padding: 12px 14px;
          font-size: 13px; display: flex; gap: 8px; align-items: flex-start; margin-bottom: 10px;
        }

        /* card list */
        .mk-card-list { display: flex; flex-direction: column; gap: 12px; }
        .mk-card-tile {
          background: var(--surface); border-radius: 16px; border: 1px solid var(--line);
          padding: 16px; position: relative; overflow: hidden; cursor: pointer;
        }
        .mk-card-tile::before {
          content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: var(--tile-color);
        }
        .mk-card-tile-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .mk-card-name { font-weight: 700; font-size: 15px; }
        .mk-card-body { display: flex; justify-content: space-between; align-items: flex-end; }
        .mk-card-outstanding-label { font-size: 11px; color: var(--ink-soft); }
        .mk-card-outstanding { font-family: var(--font-display); font-weight: 700; font-size: 21px; }
        .mk-card-next { text-align: right; font-size: 12px; color: var(--ink-soft); }
        .mk-card-next b { color: var(--ink); font-size: 14px; }

        .mk-fab-row { display: flex; gap: 10px; margin: 12px 0 16px; }

        /* card detail */
        .mk-detail-head { display: flex; align-items: center; gap: 8px; margin: 4px 0 14px; }
        .mk-back { background: none; border: none; cursor: pointer; color: var(--ink); display: flex; }
        .mk-detail-title { font-family: var(--font-display); font-weight: 700; font-size: 19px; flex: 1; }
        .mk-detail-card {
          border-radius: 18px; padding: 18px; color: #fff; margin-bottom: 16px;
          background: linear-gradient(135deg, var(--tile-color), color-mix(in srgb, var(--tile-color) 70%, black));
        }
        .mk-detail-card .mk-card-outstanding-label { color: rgba(255,255,255,0.75); }
        .mk-detail-card .mk-card-outstanding { color: #fff; font-size: 28px; }
        .mk-schedule-list, .mk-tx-list { display: flex; flex-direction: column; gap: 8px; }
        .mk-schedule-item, .mk-tx-item, .mk-log-item {
          background: var(--surface); border: 1px solid var(--line); border-radius: 12px;
          padding: 10px 12px; display: flex; align-items: center; gap: 10px;
        }
        .mk-schedule-date, .mk-tx-date { font-size: 12px; color: var(--ink-soft); min-width: 42px; }
        .mk-schedule-date.overdue { color: var(--danger); font-weight: 700; }
        .mk-schedule-amount { font-weight: 700; }
        .mk-tx-memo { flex: 1; }
        .mk-tx-memo-title { font-size: 13.5px; display: flex; align-items: center; }
        .mk-tx-memo-sub { font-size: 11px; color: var(--ink-soft); }
        .mk-tx-amount { font-weight: 700; }

        /* account (passbook) */
        .mk-passbook {
          background: var(--surface); border: 1px solid var(--line); border-radius: 4px;
          padding: 18px; margin-bottom: 14px; position: relative;
          background-image: repeating-linear-gradient(var(--surface), var(--surface) 27px, var(--line) 28px);
        }
        .mk-passbook-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
        .mk-passbook-name { font-family: var(--font-display); font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 8px; }
        .mk-passbook-balance-label { font-size: 11px; color: var(--ink-soft); margin-top: 6px; }
        .mk-passbook-balance { font-family: var(--font-display); font-weight: 800; font-size: 26px; margin-bottom: 6px; }
        .mk-passbook-divider { border: none; border-top: 1px dashed var(--line); margin: 8px 0; }
        .mk-passbook-log-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 2px 0; }
        .mk-passbook-log-row.deposit { color: var(--bill); }
        .mk-passbook-log-row.withdraw { color: var(--danger); }
        .mk-passbook-upcoming-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 2px 0; color: var(--ink-soft); }
        .mk-passbook-upcoming-row.overdue { color: var(--danger); font-weight: 700; }
        .mk-passbook-actions { display: flex; gap: 8px; margin-top: 12px; }

        /* wallet tab */
        .mk-wallet-hero { display: flex; flex-direction: column; align-items: center; padding: 8px 0 4px; }
        .mk-equation { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; margin: 16px 0; }
        .mk-equation-row { display: flex; justify-content: space-between; font-size: 13.5px; padding: 4px 0; }
        .mk-equation-row.total { border-top: 1px solid var(--line); margin-top: 6px; padding-top: 8px; font-weight: 700; font-size: 15px; }
        .mk-equation-row.negative { color: var(--danger); }
        .mk-settings-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .mk-settings-grid label { font-size: 11px; color: var(--ink-soft); display: block; margin-bottom: 4px; }
        .mk-settings-grid input { width: 100%; }
        .mk-transition-row { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 6px 0; }
        .mk-transition-row:not(:last-child) { border-bottom: 1px dashed var(--line); }
        .mk-transition-label { width: 62px; color: var(--ink-soft); }
        .mk-transition-label.danger { color: var(--danger); font-weight: 700; }
        .mk-transition-amount { font-weight: 700; margin-left: auto; }
        .mk-transition-amount.negative { color: var(--danger); }

        /* wallet visual */
        .mk-wallet-large .mk-wallet-pocket { width: 210px; height: 150px; }
        .mk-wallet-small .mk-wallet-pocket { width: 46px; height: 34px; }
        .mk-wallet-pocket {
          position: relative; border-radius: 16px 16px 22px 22px;
          background: linear-gradient(145deg, #fff, var(--bill-soft));
          border: 2px solid var(--bill); overflow: hidden;
          display: flex; align-items: flex-end; justify-content: center; padding: 8px;
        }
        .mk-wallet-danger .mk-wallet-pocket { border-color: var(--danger); background: linear-gradient(145deg, #fff, var(--danger-soft)); }
        .mk-wallet-empty .mk-wallet-pocket { border-color: var(--line); background: var(--paper); }
        .mk-wallet-contents { display: flex; flex-direction: column-reverse; align-items: center; gap: 3px; width: 100%; }
        .mk-bill {
          width: 82%; height: 14px; border-radius: 3px;
          background: linear-gradient(90deg, var(--bill), color-mix(in srgb, var(--bill) 70%, white));
          border: 1px solid color-mix(in srgb, var(--bill) 60%, black);
        }
        .mk-wallet-small .mk-bill { height: 6px; }
        .mk-coins-row { display: flex; gap: 3px; margin-top: 2px; }
        .mk-coin { width: 16px; height: 16px; border-radius: 50%; background: var(--coin); border: 1px solid color-mix(in srgb, var(--coin) 60%, black); }
        .mk-wallet-small .mk-coin { width: 8px; height: 8px; }
        .mk-wallet-flap { position: absolute; top: -6px; left: 10%; right: 10%; height: 18px; border-radius: 0 0 40% 40%; background: var(--paper); border: 2px solid var(--line); border-top: none; }
        .mk-wallet-warn { position: absolute; top: 8px; color: var(--danger); }

        /* nav */
        .mk-nav {
          position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 480px; background: var(--surface); border-top: 1px solid var(--line);
          display: flex; padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
        }
        .mk-nav-btn {
          flex: 1; background: none; border: none; display: flex; flex-direction: column; align-items: center;
          gap: 3px; font-size: 10.5px; color: var(--ink-soft); padding: 6px 0; cursor: pointer;
        }
        .mk-nav-btn.active { color: var(--indigo); }

        /* buttons/forms */
        .mk-btn {
          border-radius: 10px; padding: 10px 16px; font-size: 14px; border: 1px solid transparent;
          cursor: pointer; font-family: var(--font-body); font-weight: 500;
        }
        .mk-btn-primary { background: var(--indigo); color: #fff; }
        .mk-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .mk-btn-ghost { background: none; border-color: var(--line); color: var(--ink); }
        .mk-btn-full { width: 100%; }
        .mk-btn-add {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: var(--surface); border: 1px dashed var(--line); color: var(--ink-soft);
          border-radius: 12px; padding: 12px; cursor: pointer; font-size: 13.5px; flex: 1;
        }
        .mk-icon-btn { background: none; border: none; cursor: pointer; color: var(--ink-soft); display: flex; padding: 4px; }
        .mk-icon-row { display: flex; gap: 4px; }

        .mk-overlay {
          position: fixed; inset: 0; background: rgba(33,48,58,0.45); display: flex;
          align-items: flex-end; justify-content: center; z-index: 50;
        }
        .mk-modal {
          background: var(--paper); width: 100%; max-width: 480px; border-radius: 20px 20px 0 0;
          max-height: 88vh; overflow-y: auto; padding-bottom: 20px;
        }
        .mk-modal-head {
          display: flex; justify-content: space-between; align-items: center; padding: 16px 18px;
          font-weight: 700; font-size: 15px; border-bottom: 1px solid var(--line);
        }
        .mk-modal-body { padding: 16px 18px; }
        .mk-form { display: flex; flex-direction: column; gap: 12px; }
        .mk-form-row { display: flex; gap: 10px; }
        .mk-form-row .mk-field { flex: 1; }
        .mk-field { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; color: var(--ink-soft); }
        .mk-field input, .mk-field select {
          font-family: var(--font-body); font-size: 14px; color: var(--ink); padding: 9px 10px;
          border-radius: 8px; border: 1px solid var(--line); background: var(--surface);
        }
        .mk-form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px; }
        .mk-color-row { display: flex; gap: 8px; }
        .mk-color-dot { width: 26px; height: 26px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
        .mk-color-dot-active { border-color: var(--ink); }
        .mk-toggle-row { display: flex; gap: 8px; }
        .mk-toggle {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 9px; border-radius: 8px; border: 1px solid var(--line); background: var(--surface);
          color: var(--ink-soft); cursor: pointer; font-size: 13px;
        }
        .mk-toggle-active { border-color: var(--indigo); color: var(--indigo); background: color-mix(in srgb, var(--indigo) 8%, white); }

        .mk-confirm { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--danger); }
        .mk-mini-btn {
          font-size: 11.5px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--line);
          background: var(--surface); cursor: pointer; display: flex; align-items: center; gap: 3px;
        }
        .mk-mini-danger { border-color: var(--danger); color: var(--danger); }
        .mk-empty-note { color: var(--ink-soft); font-size: 13px; text-align: center; padding: 30px 10px; }
      `}</style>

      {tab === "home" && (
        <div>
          <div className="mk-header"><h1>マネカン</h1></div>
          <div className="mk-screen">
            <div className="mk-hero">
              <div className="mk-hero-top">
                <span className="mk-hero-label"><Wallet size={15} /> 自由に使える金額</span>
                <StatusBadge status={status} />
              </div>
              <div className="mk-hero-amount">{yen(freeMoney)}</div>
              <div className="mk-hero-sub">今後の支払いを考慮した金額です。</div>
              <div className="mk-hero-row">
                <WalletVisual free={freeMoney} low={thresholdLow} mid={thresholdMid} size="small" />
              </div>
            </div>

            {anyShortfall && (
              <div className="mk-warn-banner">
                <AlertTriangle size={18} />
                <span>支払いに対して口座残高が不足する可能性があります。「口座」タブで確認してください。</span>
              </div>
            )}

            <div className="mk-stats">
              <div className="mk-stat">
                <div className="mk-stat-label">🏦 全口座残高</div>
                <div className="mk-stat-value">{yen(totalAccountBalance)}</div>
              </div>
              <div className="mk-stat">
                <div className="mk-stat-label">💳 今後のカード支払い</div>
                <div className="mk-stat-value">{yen(totalFuturePayments)}</div>
              </div>
              <div className="mk-stat mk-stat-wide">
                <div className="mk-stat-label">🛡️ 最低確保額</div>
                <div className="mk-stat-value">{yen(minSecure)}</div>
              </div>
            </div>

            <div className="mk-section-title">次の支払い</div>
            {nextPaymentOverall ? (
              <div className="mk-next-payment">
                <div className={`mk-next-date ${nextPaymentOverall.overdue ? "overdue" : ""}`}>{fmtDate(nextPaymentOverall.date)}</div>
                <div className="mk-next-info">
                  <div className="mk-next-card">
                    {nextPaymentOverall.overdue && <span className="mk-overdue-tag">支払い期日超過</span>}
                    {nextPaymentOverall.cardName}
                  </div>
                  <div className="mk-next-amount">{yen(nextPaymentOverall.amount)}</div>
                  <div className="mk-next-account">
                    引落口座：{accounts.find((a) => a.id === nextPaymentOverall.accountId)?.name ?? "-"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mk-empty-note">予定されている支払いはありません</div>
            )}
          </div>
        </div>
      )}

      {tab === "cards" && !selectedCard && (
        <div>
          <div className="mk-header"><h1>カード</h1></div>
          <div className="mk-screen">
            <div className="mk-fab-row">
              <button className="mk-btn-add" onClick={() => setModal({ type: "addCard" })}><Plus size={16} /> カードを追加</button>
              {cards.length > 0 && (
                <button className="mk-btn-add" onClick={() => setModal({ type: "addTx" })}><Plus size={16} /> 利用登録</button>
              )}
            </div>
            {cardsWithSchedule.length === 0 && <div className="mk-empty-note">カードが登録されていません</div>}
            <div className="mk-card-list">
              {cardsWithSchedule.map((c) => (
                <div key={c.id} className="mk-card-tile" style={{ "--tile-color": c.color }} onClick={() => setSelectedCardId(c.id)}>
                  <div className="mk-card-tile-head">
                    <CreditCard size={16} color={c.color} />
                    <span className="mk-card-name">{c.name}</span>
                  </div>
                  <div className="mk-card-body">
                    <div>
                      <div className="mk-card-outstanding-label">未払い利用額</div>
                      <div className="mk-card-outstanding">{yen(c.outstanding)}</div>
                    </div>
                    {c.next && (
                      <div className="mk-card-next">
                        次回支払い<br />
                        <b>{fmtDate(c.next.date)} {yen(c.next.amount)}</b>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "cards" && selectedCard && (
        <div>
          <div className="mk-screen" style={{ paddingTop: 18 }}>
            <div className="mk-detail-head">
              <button className="mk-back" onClick={() => setSelectedCardId(null)}><ChevronLeft size={20} /></button>
              <span className="mk-detail-title">{selectedCard.name}</span>
              <div className="mk-icon-row">
                <button className="mk-icon-btn" onClick={() => setModal({ type: "editCard", payload: selectedCard })}><Pencil size={16} /></button>
                {confirming === "card-" + selectedCard.id ? (
                  <ConfirmDelete onConfirm={() => deleteCard(selectedCard.id)} onCancel={() => setConfirming(null)} />
                ) : (
                  <button className="mk-icon-btn" onClick={() => setConfirming("card-" + selectedCard.id)}><Trash2 size={16} /></button>
                )}
              </div>
            </div>

            <div className="mk-detail-card" style={{ "--tile-color": selectedCard.color }}>
              <div className="mk-card-outstanding-label">未払い利用額</div>
              <div className="mk-card-outstanding">{yen(selectedCard.outstanding)}</div>
            </div>

            <div className="mk-section-title">支払いスケジュール</div>
            {selectedCard.schedule.length === 0 ? (
              <div className="mk-empty-note">支払い予定はありません</div>
            ) : (
              <div className="mk-schedule-list">
                {selectedCard.schedule.map((s) => {
                  const isOverdue = s.date < startOfToday();
                  return (
                    <div key={s.month} className="mk-schedule-item">
                      <div>
                        <div className={`mk-schedule-date ${isOverdue ? "overdue" : ""}`}>
                          {isOverdue && <AlertTriangle size={10} style={{ marginRight: 2 }}/>}
                          {fmtDateFull(s.date)}
                        </div>
                      </div>
                      <span className="mk-schedule-amount" style={{ marginLeft: "auto", marginRight: "8px" }}>{yen(s.amount)}</span>
                      <button className="mk-mini-btn" onClick={() => markAsPaid(selectedCard.id, s.month)}>
                        支払い済みにする
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mk-section-title" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>利用明細</span>
              <button className="mk-mini-btn" onClick={() => setModal({ type: "addTx", payload: { cardId: selectedCard.id } })}>
                <Plus size={13} /> 追加
              </button>
            </div>
            {selectedCard.txs.length === 0 ? (
              <div className="mk-empty-note">利用明細がありません</div>
            ) : (
              <div className="mk-tx-list">
                {selectedCard.txs.map((t) => (
                  <div key={t.id} className="mk-tx-item" style={t.paid ? { opacity: 0.6 } : {}}>
                    <span className="mk-tx-date">{fmtDate(new Date(t.date + "T00:00:00"))}</span>
                    <div className="mk-tx-memo">
                      <div className="mk-tx-memo-title">
                        {t.paid && (
                          <span className="mk-badge" style={{ '--badge-color': 'var(--ink-soft)', padding: '2px 6px', fontSize: '10px', marginRight: '6px' }}>
                            <Check size={10} style={{ marginRight: 2 }} /> 支払済
                          </span>
                        )}
                        {t.memo || "利用"}
                      </div>
                      <div className="mk-tx-memo-sub">支払い月：{t.paymentMonth}</div>
                    </div>
                    <span className="mk-tx-amount">{yen(t.amount)}</span>
                    {confirming === "tx-" + t.id ? (
                      <ConfirmDelete onConfirm={() => deleteTransaction(t.id)} onCancel={() => setConfirming(null)} />
                    ) : (
                      <button className="mk-icon-btn" onClick={() => setConfirming("tx-" + t.id)}><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "accounts" && (
        <div>
          <div className="mk-header"><h1>口座</h1></div>
          <div className="mk-screen">
            <div className="mk-fab-row">
              <button className="mk-btn-add" onClick={() => setModal({ type: "addAccount" })}><Plus size={16} /> 口座を追加</button>
            </div>
            {accountViews.length === 0 && <div className="mk-empty-note">口座が登録されていません</div>}
            {accountViews.map((a) => (
              <div key={a.id} className="mk-passbook">
                <div className="mk-passbook-head">
                  <span className="mk-passbook-name"><BookOpen size={16} /> {a.name}</span>
                  <div className="mk-icon-row">
                    <button className="mk-icon-btn" onClick={() => setModal({ type: "editAccount", payload: a })}><Pencil size={15} /></button>
                    {confirming === "acc-" + a.id ? (
                      cards.some((c) => c.accountId === a.id) ? (
                        <span className="mk-confirm">紐づくカードがあり削除できません
                          <button className="mk-mini-btn" onClick={() => setConfirming(null)}>閉じる</button>
                        </span>
                      ) : (
                        <ConfirmDelete onConfirm={() => deleteAccount(a.id)} onCancel={() => setConfirming(null)} />
                      )
                    ) : (
                      <button className="mk-icon-btn" onClick={() => setConfirming("acc-" + a.id)}><Trash2 size={15} /></button>
                    )}
                  </div>
                </div>
                <div className="mk-passbook-balance-label">現在残高</div>
                <div className="mk-passbook-balance">{yen(a.balance)}</div>

                {a.logs.length > 0 && (
                  <>
                    <hr className="mk-passbook-divider" />
                    {a.logs.slice(0, 3).map((l) => (
                      <div key={l.id} className={`mk-passbook-log-row ${l.type}`}>
                        <span>{fmtDate(new Date(l.date + "T00:00:00"))} {l.memo || (l.type === "deposit" ? "入金" : "出金")}</span>
                        <span>{l.type === "deposit" ? "+" : "-"}{yen(l.amount).replace("-", "")}</span>
                      </div>
                    ))}
                  </>
                )}

                {a.upcoming.length > 0 && (
                  <>
                    <hr className="mk-passbook-divider" />
                    <div className="mk-passbook-balance-label">引落予定</div>
                    {a.upcoming.slice(0, 4).map((u, i) => (
                      <div key={i} className={`mk-passbook-upcoming-row ${u.overdue ? "overdue" : ""}`}>
                        <span>{u.overdue ? "⚠ " : ""}{fmtDate(u.date)} {u.cardName}</span>
                        <span>-{yen(u.amount).replace("-", "")}</span>
                      </div>
                    ))}
                  </>
                )}

                {a.shortfall && (
                  <div className="mk-warn-banner" style={{ marginTop: 10 }}>
                    <AlertTriangle size={16} />
                    <span>支払いに対して残高が不足する可能性があります。{fmtDate(a.shortfall.date)}までに{yen(a.shortfall.needed)}以上の入金が必要です。</span>
                  </div>
                )}

                <div className="mk-passbook-actions">
                  <button className="mk-mini-btn" onClick={() => setModal({ type: "addLog", payload: a.id })}>
                    <Plus size={13} /> 入出金を記録
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "wallet" && (
        <div>
          <div className="mk-header"><h1>財布</h1></div>
          <div className="mk-screen">
            <div className="mk-wallet-hero">
              <WalletVisual free={freeMoney} low={thresholdLow} mid={thresholdMid} size="large" />
              <div className="mk-hero-amount" style={{ marginTop: 14 }}>{yen(freeMoney)}</div>
              <StatusBadge status={status} />
            </div>

            <div className="mk-equation">
              <div className="mk-equation-row"><span>全口座残高</span><span>{yen(totalAccountBalance)}</span></div>
              <div className="mk-equation-row negative"><span>今後のカード支払い</span><span>-{yen(totalFuturePayments).replace("-", "")}</span></div>
              <div className="mk-equation-row negative"><span>最低確保額</span><span>-{yen(minSecure).replace("-", "")}</span></div>
              <div className="mk-equation-row total"><span>自由に使える金額</span><span>{yen(freeMoney)}</span></div>
            </div>

            <div className="mk-section-title">設定</div>
            <div className="mk-equation">
              <div className="mk-settings-grid">
                <Field label="最低確保額">
                  <input type="number" value={minSecure} onChange={(e) => update({ minSecure: Number(e.target.value) || 0 })} />
                </Field>
                <Field label="少ないライン">
                  <input type="number" value={thresholdLow} onChange={(e) => update({ thresholdLow: Number(e.target.value) || 0 })} />
                </Field>
                <Field label="注意ライン">
                  <input type="number" value={thresholdMid} onChange={(e) => update({ thresholdMid: Number(e.target.value) || 0 })} />
                </Field>
              </div>
            </div>

            <div className="mk-section-title">未来の資金推移</div>
            <div className="mk-equation">
              {fundsTransition.map((r, i) => (
                <div key={i} className="mk-transition-row">
                  <span className={`mk-transition-label ${r.label === "期限超過" ? "danger" : ""}`}>{r.label}</span>
                  <ChevronRight size={13} color="var(--ink-soft)" />
                  <span className={`mk-transition-amount ${r.amount < 0 ? "negative" : ""}`}>{yen(r.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mk-nav">
        <button className={`mk-nav-btn ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")}>
          <Home size={20} /> ホーム
        </button>
        <button className={`mk-nav-btn ${tab === "cards" ? "active" : ""}`} onClick={() => { setTab("cards"); setSelectedCardId(null); }}>
          <CreditCard size={20} /> カード
        </button>
        <button className={`mk-nav-btn ${tab === "accounts" ? "active" : ""}`} onClick={() => setTab("accounts")}>
          <BookOpen size={20} /> 口座
        </button>
        <button className={`mk-nav-btn ${tab === "wallet" ? "active" : ""}`} onClick={() => setTab("wallet")}>
          <Wallet size={20} /> 財布
        </button>
      </div>

      {modal?.type === "addAccount" && (
        <Modal title="口座を追加" onClose={() => setModal(null)}>
          <AccountForm onSave={saveAccount} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "editAccount" && (
        <Modal title="口座を編集" onClose={() => setModal(null)}>
          <AccountForm initial={modal.payload} onSave={saveAccount} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "addCard" && (
        <Modal title="カードを追加" onClose={() => setModal(null)}>
          <CardForm accounts={accounts} onSave={saveCard} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "editCard" && (
        <Modal title="カードを編集" onClose={() => setModal(null)}>
          <CardForm initial={modal.payload} accounts={accounts} onSave={saveCard} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "addTx" && (
        <Modal title="利用登録" onClose={() => setModal(null)}>
          <TransactionForm cards={cards} presetCardId={modal.payload?.cardId} onSave={saveTransaction} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "addLog" && (
        <Modal title="入出金を記録" onClose={() => setModal(null)}>
          <AccountLogForm onSave={(log) => addAccountLog(modal.payload, log)} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
