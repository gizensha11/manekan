import React, { useState, useEffect, useMemo } from "react";
import {
  Home, CreditCard, BookOpen, Wallet, Plus, X, Pencil, Trash2,
  AlertTriangle, ChevronRight, ChevronLeft, ArrowDownCircle, ArrowUpCircle, Check, Download, Upload, CalendarDays
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
  const year = d.getFullYear();
  const month = d.getMonth();
  
  let closingKey = monthKeyOf(d);
  let actualClosingDay = closingDay === 'end' 
    ? new Date(year, month + 1, 0).getDate() 
    : Number(closingDay);
    
  if (day > actualClosingDay) closingKey = addMonthsToKey(closingKey, 1);
  return addMonthsToKey(closingKey, 1);
};
const fmtDate = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
const fmtDateFull = (d) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
const dateKeyOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return `${y}年${m}月`;
};
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
  incomes: [],
  recurringRules: [],
  recurringDone: []
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

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div className="mk-confirm">
      <span>削除しますか？</span>
      <button className="mk-mini-btn mk-mini-danger" onClick={onConfirm}><Check size={14} /> 削除</button>
      <button className="mk-mini-btn" onClick={onCancel}>やめる</button>
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
          <select value={closingDay} onChange={(e) => setClosingDay(e.target.value === 'end' ? 'end' : Number(e.target.value))}>
            {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}日</option>)}
            <option value="end">月末</option>
          </select>
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
            closingDay: closingDay === 'end' ? 'end' : Math.min(31, Math.max(1, Number(closingDay) || 1)),
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

function QuickTransactionForm({ cards, presetCardId, onSave, onCancel }) {
  const initialCardId = presetCardId && cards.some((c) => c.id === presetCardId)
    ? presetCardId
    : (cards[0]?.id ?? "");
  const [cardId, setCardId] = useState(initialCardId);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState(todayStr());

  const card = cards.find((c) => c.id === cardId);
  const paymentMonth = card ? computePaymentMonth(date, card.closingDay) : "";

  const submit = (e) => {
    e?.preventDefault?.();
    if (!cardId || !(Number(amount) > 0) || !paymentMonth) return;
    onSave({
      id: uid(),
      cardId,
      date,
      amount: Number(amount),
      memo: memo.trim(),
      paymentMonth,
      paid: false,
      paidDate: null,
    });
  };

  return (
    <form className="mk-form" onSubmit={submit}>
      <div className="mk-quick-note">カードを選んで金額を入れるだけ。支払い月は自動で判定します。</div>

      <div className="mk-quick-card-grid">
        {cards.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`mk-quick-card ${cardId === c.id ? "active" : ""}`}
            style={{ "--quick-color": c.color }}
            onClick={() => setCardId(c.id)}
          >
            <span className="mk-quick-card-dot" />
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <Field label="金額">
        <input
          type="number"
          min="1"
          inputMode="numeric"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="mk-quick-amount-input"
        />
      </Field>

      <div className="mk-form-row">
        <Field label="利用日">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="支払い予定月">
          <div className="mk-quick-auto-month">{paymentMonth || "-"}</div>
        </Field>
      </div>

      <Field label="店名・メモ（任意）">
        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例）コンビニ" />
      </Field>

      <div className="mk-form-actions">
        <button type="button" className="mk-btn mk-btn-ghost" onClick={onCancel}>キャンセル</button>
        <button type="submit" className="mk-btn mk-btn-primary" disabled={!cardId || !(Number(amount) > 0)}>
          <Plus size={15} /> 登録
        </button>
      </div>
    </form>
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

function IncomeForm({ accounts, onSave, onCancel }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

  return (
    <div className="mk-form">
      <Field label="収入名">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例）バイト代、給料" />
      </Field>
      <Field label="金額">
        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      </Field>
      <Field label="入金予定日">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="入金口座">
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.length === 0 && <option value="">口座を先に登録してください</option>}
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <div className="mk-form-actions">
        <button className="mk-btn mk-btn-ghost" onClick={onCancel}>キャンセル</button>
        <button
          className="mk-btn mk-btn-primary"
          disabled={!name.trim() || !(Number(amount) > 0) || !accountId}
          onClick={() => onSave({
            id: uid(), name: name.trim(), amount: Number(amount), date, accountId, received: false
          })}
        >
          登録
        </button>
      </div>
    </div>
  );
}


function RecurringRuleForm({ initial, accounts, onSave, onCancel }) {
  const [type, setType] = useState(initial?.type ?? "income");
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [day, setDay] = useState(initial?.day ?? 25);
  const [accountId, setAccountId] = useState(initial?.accountId ?? accounts[0]?.id ?? "");
  const [startMonth, setStartMonth] = useState(initial?.startMonth ?? monthKeyOf(new Date()));

  const submit = (e) => {
    e?.preventDefault?.();
    if (!name.trim() || !(Number(amount) > 0) || !accountId) return;
    onSave({
      id: initial?.id ?? uid(),
      type,
      name: name.trim(),
      amount: Number(amount),
      day: Math.min(31, Math.max(1, Number(day) || 1)),
      accountId,
      startMonth,
      active: initial?.active ?? true,
    });
  };

  return (
    <form className="mk-form" onSubmit={submit}>
      <div className="mk-toggle-row">
        <button type="button" className={`mk-toggle ${type === "income" ? "mk-toggle-active" : ""}`} onClick={() => setType("income")}>
          <ArrowDownCircle size={16} /> 定期収入
        </button>
        <button type="button" className={`mk-toggle ${type === "expense" ? "mk-toggle-active" : ""}`} onClick={() => setType("expense")}>
          <ArrowUpCircle size={16} /> 定期支出
        </button>
      </div>
      <Field label="名前">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={type === "income" ? "例）バイト代" : "例）家賃、サブスク"} />
      </Field>
      <div className="mk-form-row">
        <Field label="金額">
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>
        <Field label="毎月の日付">
          <input type="number" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)} />
        </Field>
      </div>
      <Field label={type === "income" ? "入金口座" : "支出口座"}>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.length === 0 && <option value="">口座を先に登録してください</option>}
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label="開始月">
        <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
      </Field>
      <div className="mk-quick-note">29〜31日を指定した月でその日が存在しない場合は、その月の末日として扱います。</div>
      <div className="mk-form-actions">
        <button type="button" className="mk-btn mk-btn-ghost" onClick={onCancel}>キャンセル</button>
        <button type="submit" className="mk-btn mk-btn-primary" disabled={!name.trim() || !(Number(amount) > 0) || !accountId}>
          {initial ? "保存" : "登録"}
        </button>
      </div>
    </form>
  );
}

/* ---------- main app ---------- */

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [data, setData] = useState(INITIAL);
  const [modal, setModal] = useState(null); 
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [confirming, setConfirming] = useState(null); 
  const [backupMessage, setBackupMessage] = useState(null);
  const [undoEntry, setUndoEntry] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => monthKeyOf(startOfToday()));
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(() => todayStr());

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("manekan-data", false);
        if (res && res.value) setData(JSON.parse(res.value));
      } catch (e) {
        // no saved data yet
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

  const {
    accounts, cards, transactions, accountLogs, minSecure, thresholdLow, thresholdMid,
    incomes = [], lastUsedCardId = null, recurringRules = [], recurringDone = []
  } = data;
  const update = (patch, label = "変更しました") => {
    setUndoEntry({ data, label });
    setData((d) => ({ ...d, ...patch }));
  };

  const undoLastChange = () => {
    if (!undoEntry) return;
    const { data: previousData, label } = undoEntry;
    setData(previousData);
    setUndoEntry(null);
    setConfirming(null);
    setModal(null);
    setBackupMessage({ type: "success", text: `「${label}」を取り消しました` });
  };

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
  
  const heroState = freeMoney < 0
    ? { type: "danger", label: "支払いに対して不足しています", icon: <AlertTriangle size={18} /> }
    : freeMoney < minSecure
    ? { type: "warning", label: "セーフラインを下回っています", icon: <AlertTriangle size={18} /> }
    : { type: "normal", label: "安全に使える", icon: <Check size={18} /> };

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

  const recurringEvents = useMemo(() => {
    const today = startOfToday();
    const doneKeys = new Set(recurringDone.map((d) => d.key));
    const windowStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const windowEnd = new Date(today.getFullYear(), today.getMonth() + 5, 1);
    const events = [];

    recurringRules.filter((r) => r.active !== false).forEach((rule) => {
      const [sy, sm] = String(rule.startMonth || monthKeyOf(today)).split("-").map(Number);
      const ruleStart = new Date(sy, (sm || 1) - 1, 1);
      let cursor = ruleStart > windowStart ? ruleStart : windowStart;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);

      while (cursor <= windowEnd) {
        const month = monthKeyOf(cursor);
        const key = `${rule.id}:${month}`;
        if (!doneKeys.has(key)) {
          const date = dateForMonthDay(month, rule.day);
          events.push({
            key,
            ruleId: rule.id,
            month,
            date,
            amount: rule.type === "expense" ? -Math.abs(rule.amount) : Math.abs(rule.amount),
            rawAmount: Math.abs(rule.amount),
            label: rule.name,
            type: rule.type,
            accountId: rule.accountId,
            overdue: date < today,
            recurring: true,
          });
        }
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
    });

    return events.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) return a.date - b.date;
      return a.amount - b.amount;
    });
  }, [recurringRules, recurringDone]);

  const accountViews = useMemo(() => {
    const today = startOfToday();
    return accounts.map((acc) => {
      const linkedCards = cardsWithSchedule.filter((c) => c.accountId === acc.id);
      const upcomingPayments = linkedCards
        .flatMap((c) => c.schedule.filter((s) => s.amount > 0).map((s) => ({
          date: s.date, amount: -s.amount, label: c.name, type: 'payment', overdue: s.date < today
        })));
        
      const upcomingIncomes = incomes
        .filter((inc) => inc.accountId === acc.id && !inc.received)
        .map((inc) => {
          const d = new Date(inc.date + "T00:00:00");
          return {
            date: d, amount: inc.amount, label: inc.name, type: 'income', overdue: d < today, original: inc
          };
        });

      const upcomingRecurring = recurringEvents
        .filter((ev) => ev.accountId === acc.id)
        .map((ev) => ({ ...ev }));

      // 同日の場合は安全側に倒して、支出（負の値）を先に適用する。
      const upcoming = [...upcomingPayments, ...upcomingIncomes, ...upcomingRecurring].sort((a, b) => {
        if (a.date.getTime() !== b.date.getTime()) return a.date - b.date;
        return a.amount - b.amount;
      });
      
      let running = acc.balance;
      let shortfall = null;
      for (const p of upcoming) {
        // 修正2: 期限超過の収入は加算しない（計算から除外）
        if (p.type === 'income' && p.overdue) {
          continue;
        }
        
        running += p.amount;
        if (running < 0 && !shortfall) shortfall = { date: p.date, needed: -running };
      }
      
      const logs = accountLogs.filter((l) => l.accountId === acc.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      return { ...acc, upcoming, shortfall, logs };
    });
  }, [accounts, cardsWithSchedule, accountLogs, incomes, recurringEvents]);

  const fundsTransition = useMemo(() => {
    const today = startOfToday();
    let overdueAmount = 0;
    const events = [];

    cardsWithSchedule.forEach((c) => {
      c.schedule.forEach((s) => {
        if (s.amount > 0) {
          if (s.date < today) {
            overdueAmount += s.amount;
          } else {
            events.push({ date: s.date, amount: -s.amount, label: c.name, type: 'payment' });
          }
        }
      });
    });

    incomes.forEach((inc) => {
      if (!inc.received) {
        const d = new Date(inc.date + "T00:00:00");
        const isOverdue = d < today;
        events.push({ date: d, amount: inc.amount, label: inc.name, type: 'income', overdue: isOverdue });
      }
    });

    recurringEvents.forEach((ev) => {
      events.push({
        date: ev.date,
        amount: ev.amount,
        label: `${ev.label}（定期）`,
        type: ev.type,
        overdue: ev.overdue,
        recurring: true,
      });
    });

    // 支払いが先になるようにソート
    events.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) return a.date - b.date;
      return a.amount - b.amount;
    });

    let running = totalAccountBalance - minSecure;
    const rows = [{ label: "現在", amount: running }];

    if (overdueAmount > 0) {
      running -= overdueAmount;
      rows.push({ label: "期限超過", amount: running });
    }

    events.forEach((ev) => {
      // 修正2: 期限超過の収入は将来残高に加算しない
      if (ev.type === 'income' && ev.overdue) {
        rows.push({
          label: fmtDate(ev.date),
          name: ev.label,
          delta: 0,
          amount: running,
          isOverdueIncome: true
        });
      } else {
        running += ev.amount;
        rows.push({
          label: fmtDate(ev.date),
          name: ev.label,
          delta: ev.amount,
          amount: running
        });
      }
    });

    return rows.slice(0, 10);
  }, [cardsWithSchedule, incomes, recurringEvents, totalAccountBalance, minSecure]);

  const anyShortfall = accountViews.some((a) => a.shortfall);

  /* ----- future calendar ----- */

  const calendarMonthEvents = useMemo(() => {
    const today = startOfToday();
    const doneKeys = new Set(recurringDone.map((d) => d.key));
    const events = [];

    cardsWithSchedule.forEach((card) => {
      card.schedule.forEach((s) => {
        if (monthKeyOf(s.date) !== calendarMonth || !(s.amount > 0)) return;
        const account = accounts.find((a) => a.id === card.accountId);
        events.push({
          id: `cal-card-${card.id}-${s.month}`,
          date: s.date,
          dateKey: dateKeyOf(s.date),
          amount: -s.amount,
          rawAmount: s.amount,
          label: card.name,
          type: 'payment',
          overdue: s.date < today,
          accountId: card.accountId,
          accountName: account?.name ?? '口座不明',
          cardId: card.id,
          paymentMonth: s.month,
          sourceLabel: 'カード支払い',
        });
      });
    });

    incomes.forEach((inc) => {
      if (inc.received) return;
      const d = new Date(inc.date + "T00:00:00");
      if (monthKeyOf(d) !== calendarMonth) return;
      const account = accounts.find((a) => a.id === inc.accountId);
      events.push({
        id: `cal-income-${inc.id}`,
        date: d,
        dateKey: dateKeyOf(d),
        amount: Math.abs(inc.amount),
        rawAmount: Math.abs(inc.amount),
        label: inc.name,
        type: 'income',
        overdue: d < today,
        accountId: inc.accountId,
        accountName: account?.name ?? '口座不明',
        original: inc,
        sourceLabel: '収入予定',
      });
    });

    recurringRules.filter((r) => r.active !== false).forEach((rule) => {
      const startMonth = rule.startMonth || monthKeyOf(today);
      if (calendarMonth < startMonth) return;
      const key = `${rule.id}:${calendarMonth}`;
      if (doneKeys.has(key)) return;

      const d = dateForMonthDay(calendarMonth, rule.day);
      const amount = rule.type === 'expense' ? -Math.abs(rule.amount) : Math.abs(rule.amount);
      const account = accounts.find((a) => a.id === rule.accountId);
      events.push({
        id: `cal-recurring-${key}`,
        key,
        ruleId: rule.id,
        month: calendarMonth,
        date: d,
        dateKey: dateKeyOf(d),
        amount,
        rawAmount: Math.abs(rule.amount),
        label: rule.name,
        type: rule.type,
        overdue: d < today,
        recurring: true,
        accountId: rule.accountId,
        accountName: account?.name ?? '口座不明',
        sourceLabel: rule.type === 'income' ? '定期収入' : '定期支出',
      });
    });

    return events.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) return a.date - b.date;
      return a.amount - b.amount;
    });
  }, [cardsWithSchedule, incomes, recurringRules, recurringDone, calendarMonth, accounts]);

  const calendarGrid = useMemo(() => {
    const [y, m] = calendarMonth.split("-").map(Number);
    const firstWeekday = new Date(y, m - 1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const byDate = new Map();
    calendarMonthEvents.forEach((ev) => {
      if (!byDate.has(ev.dateKey)) byDate.set(ev.dateKey, []);
      byDate.get(ev.dateKey).push(ev);
    });

    return Array.from({ length: 42 }, (_, index) => {
      const day = index - firstWeekday + 1;
      if (day < 1 || day > daysInMonth) return null;
      const key = `${calendarMonth}-${pad2(day)}`;
      return { day, key, events: byDate.get(key) || [] };
    });
  }, [calendarMonth, calendarMonthEvents]);

  const calendarMonthStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let overdueIncomeCount = 0;
    calendarMonthEvents.forEach((ev) => {
      if (ev.amount < 0) expense += Math.abs(ev.amount);
      if (ev.amount > 0) {
        if (ev.overdue) overdueIncomeCount += 1;
        else income += ev.amount;
      }
    });
    return { income, expense, overdueIncomeCount };
  }, [calendarMonthEvents]);

  const selectedCalendarEvents = useMemo(
    () => calendarMonthEvents.filter((ev) => ev.dateKey === calendarSelectedDate),
    [calendarMonthEvents, calendarSelectedDate]
  );

  const moveCalendarMonth = (delta) => {
    const nextMonth = addMonthsToKey(calendarMonth, delta);
    setCalendarMonth(nextMonth);
    setCalendarSelectedDate(`${nextMonth}-01`);
  };

  const goCalendarToday = () => {
    const today = startOfToday();
    setCalendarMonth(monthKeyOf(today));
    setCalendarSelectedDate(dateKeyOf(today));
  };

  /* ----- mutation handlers ----- */

  const saveAccount = (acc) => {
    const isEdit = accounts.some((a) => a.id === acc.id);
    update({ accounts: isEdit ? accounts.map((a) => a.id === acc.id ? acc : a) : [...accounts, acc] }, isEdit ? "口座を編集しました" : "口座を追加しました");
    setModal(null);
  };
  const deleteAccount = (id) => {
    // 修正4: 口座削除時に該当口座に紐づくincomeがないか確認
    if (
      cards.some((c) => c.accountId === id) ||
      incomes.some((inc) => inc.accountId === id) ||
      recurringRules.some((r) => r.accountId === id)
    ) { 
      setConfirming(null); 
      return; 
    }
    update({ accounts: accounts.filter((a) => a.id !== id), accountLogs: accountLogs.filter((l) => l.accountId !== id) }, "口座を削除しました");
    setConfirming(null);
  };
  const saveCard = (card) => {
    const isEdit = cards.some((c) => c.id === card.id);
    update({ cards: isEdit ? cards.map((c) => c.id === card.id ? card : c) : [...cards, card] }, isEdit ? "カードを編集しました" : "カードを追加しました");
    setModal(null);
  };
  const deleteCard = (id) => {
    update({ cards: cards.filter((c) => c.id !== id), transactions: transactions.filter((t) => t.cardId !== id) }, "カードを削除しました");
    setConfirming(null);
    if (selectedCardId === id) setSelectedCardId(null);
  };
  const saveTransaction = (tx) => {
    update({ transactions: [...transactions, tx], lastUsedCardId: tx.cardId }, "カード利用を登録しました");
    setModal(null);
  };
  const deleteTransaction = (id) => {
    update({ transactions: transactions.filter((t) => t.id !== id) }, "利用明細を削除しました");
    setConfirming(null);
  };
  const addAccountLog = (accountId, log) => {
    const delta = log.type === "deposit" ? log.amount : -log.amount;
    update({
      accounts: accounts.map((a) => a.id === accountId ? { ...a, balance: a.balance + delta } : a),
      accountLogs: [...accountLogs, { ...log, accountId }],
    }, log.type === "deposit" ? "入金を記録しました" : "出金を記録しました");
    setModal(null);
  };
  const saveIncome = (income) => {
    update({ incomes: [...incomes, income] }, "収入予定を追加しました");
    setModal(null);
  };
  const deleteIncome = (id) => {
    update({ incomes: incomes.filter((inc) => inc.id !== id) }, "収入予定を削除しました");
    setConfirming(null);
  };

  const saveRecurringRule = (rule) => {
    const isEdit = recurringRules.some((r) => r.id === rule.id);
    update({
      recurringRules: isEdit
        ? recurringRules.map((r) => r.id === rule.id ? rule : r)
        : [...recurringRules, rule]
    }, isEdit ? "定期予定を編集しました" : "定期予定を追加しました");
    setModal(null);
  };

  const deleteRecurringRule = (id) => {
    update({
      recurringRules: recurringRules.filter((r) => r.id !== id),
      recurringDone: recurringDone.filter((d) => d.ruleId !== id),
    }, "定期予定を削除しました");
    setConfirming(null);
  };

  const toggleRecurringRule = (id) => {
    const target = recurringRules.find((r) => r.id === id);
    const willResume = target?.active === false;
    update({
      recurringRules: recurringRules.map((r) => r.id === id ? { ...r, active: r.active === false } : r)
    }, willResume ? "定期予定を再開しました" : "定期予定を停止しました");
  };

  const markRecurringAsDone = (event) => {
    if (recurringDone.some((d) => d.key === event.key)) return;
    const delta = event.type === "income" ? event.rawAmount : -event.rawAmount;
    update({
      recurringDone: [...recurringDone, {
        key: event.key, ruleId: event.ruleId, month: event.month, type: event.type, completedAt: todayStr()
      }],
      accounts: accounts.map((a) => a.id === event.accountId ? { ...a, balance: a.balance + delta } : a),
      accountLogs: [...accountLogs, {
        id: uid(),
        accountId: event.accountId,
        type: event.type === "income" ? "deposit" : "withdraw",
        amount: event.rawAmount,
        date: todayStr(),
        memo: `${event.label}（定期）`,
      }],
    }, event.type === "income" ? "定期収入を入金済みにしました" : "定期支出を支払済みにしました");
  };

  const markAsPaid = (cardId, paymentMonth) => {
    update({
      transactions: transactions.map((t) =>
        t.cardId === cardId && t.paymentMonth === paymentMonth && !t.paid
          ? { ...t, paid: true, paidDate: todayStr() }
          : t
      ),
    }, "カード支払いを支払済みにしました");
  };

  const markIncomeAsReceived = (income) => {
    update({
      incomes: incomes.map(inc => inc.id === income.id ? { ...inc, received: true } : inc),
      accounts: accounts.map(a => a.id === income.accountId ? { ...a, balance: a.balance + income.amount } : a),
      accountLogs: [...accountLogs, {
        id: uid(), accountId: income.accountId, type: "deposit", amount: income.amount, date: todayStr(), memo: income.name
      }]
    }, "収入予定を入金済みにしました");
  };

  /* ----- backup / restore ----- */

  const exportBackup = () => {
    const payload = {
      format: "manekan-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manekan-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setBackupMessage({ type: "success", text: "バックアップを書き出しました" });
  };

  const isValidBackupData = (candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    if (!Array.isArray(candidate.accounts)) return false;
    if (!Array.isArray(candidate.cards)) return false;
    if (!Array.isArray(candidate.transactions)) return false;
    if (!Array.isArray(candidate.accountLogs)) return false;
    if (candidate.incomes !== undefined && !Array.isArray(candidate.incomes)) return false;
    if (candidate.recurringRules !== undefined && !Array.isArray(candidate.recurringRules)) return false;
    if (candidate.recurringDone !== undefined && !Array.isArray(candidate.recurringDone)) return false;
    return true;
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const restored = parsed?.format === "manekan-backup" ? parsed.data : parsed;

      if (!isValidBackupData(restored)) {
        throw new Error("invalid-backup");
      }

      const ok = window.confirm("現在のマネカンのデータを、このバックアップ内容で置き換えます。よろしいですか？");
      if (!ok) return;

      setUndoEntry({ data, label: "バックアップから復元しました" });
      setData({
        ...INITIAL,
        ...restored,
        incomes: restored.incomes ?? [],
        recurringRules: restored.recurringRules ?? [],
        recurringDone: restored.recurringDone ?? [],
      });
      setSelectedCardId(null);
      setConfirming(null);
      setBackupMessage({ type: "success", text: "バックアップから復元しました" });
    } catch (e) {
      setBackupMessage({ type: "error", text: "このファイルはマネカンのバックアップとして読み込めません" });
    }
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
          border-radius: 20px;
          padding: 24px 20px 20px;
          margin: 10px 0 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .mk-hero-normal { background: var(--surface); border: 1px solid var(--line); color: var(--ink); }
        .mk-hero-warning { background: var(--coin-soft); border: 1px solid var(--alert); color: var(--alert); }
        .mk-hero-danger { background: var(--danger-soft); border: 1px solid var(--danger); color: var(--danger); }
        
        .mk-hero-top { display: flex; align-items: center; justify-content: center; width: 100%; margin-bottom: 8px; }
        .mk-hero-label { font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 6px; }
        .mk-hero-amount {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 46px;
          line-height: 1.1;
          margin: 0 0 4px;
          letter-spacing: 0.02em;
        }

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

        .mk-fab-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0 16px; }

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
        .mk-passbook-log-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 4px 0; }
        .mk-passbook-log-row.deposit { color: var(--bill); }
        .mk-passbook-log-row.withdraw { color: var(--danger); }
        .mk-passbook-upcoming-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 6px 0; color: var(--ink-soft); }
        .mk-passbook-upcoming-row.overdue { color: var(--danger); font-weight: 700; }
        .mk-passbook-actions { display: flex; gap: 8px; margin-top: 12px; }

        /* wallet tab */
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
        .mk-data-tools { display: flex; flex-direction: column; gap: 8px; }
        .mk-data-tools-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .mk-file-btn { position: relative; overflow: hidden; }
        .mk-file-btn input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .mk-backup-note { color: var(--ink-soft); font-size: 11px; line-height: 1.55; }
        .mk-backup-message { font-size: 12px; padding: 8px 10px; border-radius: 8px; }
        .mk-backup-message.success { background: var(--bill-soft); color: var(--bill); }
        .mk-backup-message.error { background: var(--danger-soft); color: var(--danger); }

        /* future calendar */
        .mk-calendar-shell { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 12px; }
        .mk-calendar-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
        .mk-calendar-month { font-family: var(--font-display); font-size: 19px; font-weight: 800; text-align: center; flex: 1; }
        .mk-calendar-nav { width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .mk-calendar-today { border: none; background: var(--paper); color: var(--ink-soft); border-radius: 999px; padding: 5px 10px; font-size: 11px; cursor: pointer; font-family: var(--font-body); }
        .mk-calendar-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0 12px; }
        .mk-calendar-stat { border-radius: 12px; padding: 9px 10px; background: var(--paper); }
        .mk-calendar-stat-label { font-size: 10.5px; color: var(--ink-soft); }
        .mk-calendar-stat-value { font-family: var(--font-display); font-size: 17px; font-weight: 700; margin-top: 2px; }
        .mk-calendar-weekdays, .mk-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .mk-calendar-weekday { text-align: center; font-size: 10px; color: var(--ink-soft); padding: 3px 0; }
        .mk-calendar-day {
          aspect-ratio: 1 / 1.02; border: 1px solid transparent; border-radius: 10px; background: transparent; color: var(--ink);
          padding: 5px 3px 4px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; cursor: pointer; min-width: 0;
        }
        .mk-calendar-day:hover { background: var(--paper); }
        .mk-calendar-day.selected { background: var(--bill-soft); border-color: color-mix(in srgb, var(--bill) 45%, transparent); }
        .mk-calendar-day.today { box-shadow: inset 0 0 0 1px var(--indigo); }
        .mk-calendar-day-number { font-size: 11.5px; font-weight: 700; line-height: 1; }
        .mk-calendar-dots { display: flex; gap: 2px; min-height: 5px; align-items: center; justify-content: center; max-width: 100%; }
        .mk-calendar-dot { width: 5px; height: 5px; border-radius: 50%; flex: 0 0 auto; }
        .mk-calendar-dot.income { background: var(--bill); }
        .mk-calendar-dot.expense { background: var(--danger); }
        .mk-calendar-dot.alert { background: var(--alert); }
        .mk-calendar-more { font-size: 8px; color: var(--ink-soft); line-height: 1; }
        .mk-calendar-note { font-size: 10.5px; color: var(--ink-soft); line-height: 1.5; margin-top: 10px; }
        .mk-calendar-detail { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 12px; margin-top: 10px; }
        .mk-calendar-detail-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
        .mk-calendar-detail-date { font-family: var(--font-display); font-size: 16px; font-weight: 700; }
        .mk-calendar-detail-count { font-size: 10.5px; color: var(--ink-soft); }
        .mk-calendar-event { display: flex; align-items: center; gap: 9px; padding: 9px 0; border-top: 1px dashed var(--line); }
        .mk-calendar-event:first-of-type { border-top: none; }
        .mk-calendar-event-mark { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
        .mk-calendar-event-main { min-width: 0; flex: 1; }
        .mk-calendar-event-name { font-size: 12.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mk-calendar-event-meta { font-size: 10.5px; color: var(--ink-soft); margin-top: 2px; line-height: 1.4; }
        .mk-calendar-event-amount { font-size: 12.5px; font-weight: 700; white-space: nowrap; }
        .mk-calendar-event-actions { display: flex; align-items: center; gap: 5px; }
        .mk-calendar-warning { margin-top: 10px; background: var(--coin-soft); color: var(--alert); border-radius: 10px; padding: 8px 10px; font-size: 11px; display: flex; align-items: flex-start; gap: 6px; line-height: 1.45; }

        /* recurring rules */
        .mk-recurring-box { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 12px; margin-bottom: 14px; }
        .mk-recurring-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
        .mk-recurring-title { font-size: 13px; font-weight: 700; }
        .mk-recurring-list { display: flex; flex-direction: column; gap: 7px; }
        .mk-recurring-item { display: flex; align-items: center; gap: 8px; border-top: 1px dashed var(--line); padding-top: 8px; }
        .mk-recurring-item:first-child { border-top: none; padding-top: 0; }
        .mk-recurring-main { min-width: 0; flex: 1; }
        .mk-recurring-name { font-size: 12.5px; font-weight: 700; display: flex; gap: 6px; align-items: center; }
        .mk-recurring-meta { font-size: 10.5px; color: var(--ink-soft); margin-top: 2px; }
        .mk-recurring-amount { font-size: 12.5px; font-weight: 700; white-space: nowrap; }
        .mk-recurring-paused { opacity: 0.5; }

        /* quick transaction */
        .mk-quick-fab {
          position: fixed;
          right: max(16px, calc((100vw - 480px) / 2 + 16px));
          bottom: calc(78px + env(safe-area-inset-bottom));
          z-index: 35;
          border: none;
          border-radius: 999px;
          background: var(--indigo);
          color: #fff;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(33,48,58,0.24);
        }
        .mk-quick-note { font-size: 11.5px; line-height: 1.55; color: var(--ink-soft); }
        .mk-quick-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .mk-quick-card {
          min-width: 0;
          border: 1px solid var(--line);
          background: var(--surface);
          border-radius: 10px;
          padding: 9px 10px;
          display: flex;
          align-items: center;
          gap: 7px;
          color: var(--ink-soft);
          font-family: var(--font-body);
          font-size: 12px;
          cursor: pointer;
          text-align: left;
        }
        .mk-quick-card span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mk-quick-card.active {
          border-color: var(--quick-color);
          color: var(--ink);
          background: color-mix(in srgb, var(--quick-color) 8%, white);
          font-weight: 700;
        }
        .mk-quick-card-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--quick-color); flex: 0 0 auto; }
        .mk-quick-amount-input { font-family: var(--font-display) !important; font-size: 26px !important; font-weight: 800; }
        .mk-quick-auto-month {
          min-height: 43px;
          display: flex;
          align-items: center;
          padding: 9px 10px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--paper);
          color: var(--ink);
          font-size: 14px;
        }

        /* one-step undo */
        .mk-undo-toast {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: calc(136px + env(safe-area-inset-bottom));
          width: calc(100% - 32px);
          max-width: 448px;
          z-index: 42;
          background: var(--ink);
          color: #fff;
          border-radius: 12px;
          padding: 10px 10px 10px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 28px rgba(33,48,58,0.28);
          font-size: 12px;
        }
        .mk-undo-toast-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mk-undo-action {
          border: none; background: #fff; color: var(--ink); border-radius: 8px; padding: 6px 9px;
          font-family: var(--font-body); font-size: 11.5px; font-weight: 700; cursor: pointer; white-space: nowrap;
        }
        .mk-undo-close {
          border: none; background: none; color: rgba(255,255,255,0.72); padding: 3px; cursor: pointer; display: flex;
        }
        .mk-empty-note { color: var(--ink-soft); font-size: 13px; text-align: center; padding: 30px 10px; }
      `}</style>

      {tab === "home" && (
        <div>
          <div className="mk-header"><h1>マネカン</h1></div>
          <div className="mk-screen">
            
            <div className={`mk-hero mk-hero-${heroState.type}`}>
              <div className="mk-hero-top">
                <span className="mk-hero-label" style={{ color: "inherit" }}>
                  <Wallet size={16} /> 自由に使える金額
                </span>
              </div>
              <div className="mk-hero-amount" style={{ color: "inherit" }}>{yen(freeMoney)}</div>
              <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "12px" }}>
                今後の支払いを考慮した金額です
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13.5px", fontWeight: "bold" }}>
                {heroState.icon} <span>{heroState.label}</span>
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
              <button className="mk-btn-add" onClick={() => setModal({ type: "addIncome" })}><Plus size={16} /> 収入予定を追加</button>
            </div>

            <div className="mk-recurring-box">
              <div className="mk-recurring-head">
                <span className="mk-recurring-title">↻ 定期収入・定期支出</span>
                <button className="mk-mini-btn" onClick={() => setModal({ type: "addRecurring" })}>
                  <Plus size={13} /> 定期予定を追加
                </button>
              </div>
              {recurringRules.length === 0 ? (
                <div className="mk-quick-note">毎月のバイト代・家賃・サブスクなどを一度登録すると、未来の予定に自動で表示します。</div>
              ) : (
                <div className="mk-recurring-list">
                  {recurringRules.map((r) => (
                    <div key={r.id} className={`mk-recurring-item ${r.active === false ? "mk-recurring-paused" : ""}`}>
                      <div className="mk-recurring-main">
                        <div className="mk-recurring-name">
                          <span>{r.type === "income" ? "収入" : "支出"}</span>
                          <span>{r.name}</span>
                        </div>
                        <div className="mk-recurring-meta">
                          毎月{r.day}日 ・ {accounts.find((a) => a.id === r.accountId)?.name ?? "口座不明"}
                          {r.active === false ? " ・ 停止中" : ""}
                        </div>
                      </div>
                      <span className="mk-recurring-amount" style={{ color: r.type === "income" ? 'var(--bill)' : 'var(--danger)' }}>
                        {r.type === "income" ? "+" : "-"}{yen(r.amount).replace("-", "")}
                      </span>
                      <button className="mk-mini-btn" onClick={() => toggleRecurringRule(r.id)}>{r.active === false ? "再開" : "停止"}</button>
                      <button className="mk-icon-btn" onClick={() => setModal({ type: "editRecurring", payload: r })}><Pencil size={14} /></button>
                      {confirming === "rr-" + r.id ? (
                        <ConfirmDelete onConfirm={() => deleteRecurringRule(r.id)} onCancel={() => setConfirming(null)} />
                      ) : (
                        <button className="mk-icon-btn" onClick={() => setConfirming("rr-" + r.id)}><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {accountViews.length === 0 && <div className="mk-empty-note">口座が登録されていません</div>}
            {accountViews.map((a) => (
              <div key={a.id} className="mk-passbook">
                <div className="mk-passbook-head">
                  <span className="mk-passbook-name"><BookOpen size={16} /> {a.name}</span>
                  <div className="mk-icon-row">
                    <button className="mk-icon-btn" onClick={() => setModal({ type: "editAccount", payload: a })}><Pencil size={15} /></button>
                    {confirming === "acc-" + a.id ? (
                      cards.some((c) => c.accountId === a.id) || incomes.some((inc) => inc.accountId === a.id) || recurringRules.some((r) => r.accountId === a.id) ? (
                        <span className="mk-confirm">紐づくカード・収入予定・定期予定があり削除できません
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
                    <div className="mk-passbook-balance-label">未来の予定</div>
                    {a.upcoming.slice(0, 6).map((u, i) => (
                      <div key={u.key ?? u.original?.id ?? `${u.type}-${i}`} className={`mk-passbook-upcoming-row ${u.overdue && u.type !== 'income' ? "overdue" : ""}`} style={{ alignItems: u.type === 'income' ? 'flex-start' : 'center' }}>
                        
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>
                            {u.overdue && u.type !== 'income' ? "⚠ " : ""}
                            {fmtDate(u.date)} {u.label}{u.recurring ? "（定期）" : ""}
                          </span>
                          {u.type === 'income' && u.overdue && (
                            <span style={{ fontSize: '10.5px', color: 'var(--alert)', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                               <AlertTriangle size={10} style={{ marginRight: 2 }} /> 入金予定日超過・未確認
                            </span>
                          )}
                        </div>
                        
                        {u.type === 'income' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <span style={{ color: u.overdue ? 'var(--ink-soft)' : 'var(--bill)', fontWeight: 'bold' }}>
                                +{yen(u.amount).replace("-", "")}
                              </span>
                              <button className="mk-mini-btn" onClick={() => u.recurring ? markRecurringAsDone(u) : markIncomeAsReceived(u.original)}>入金済みにする</button>
                              {!u.recurring && (
                                confirming === "inc-" + u.original.id ? (
                                  <ConfirmDelete onConfirm={() => deleteIncome(u.original.id)} onCancel={() => setConfirming(null)} />
                                ) : (
                                  <button className="mk-icon-btn" onClick={() => setConfirming("inc-" + u.original.id)}><Trash2 size={14} /></button>
                                )
                              )}
                            </div>
                          </div>
                        ) : u.type === 'expense' && u.recurring ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>-{yen(u.rawAmount).replace("-", "")}</span>
                            <button className="mk-mini-btn" onClick={() => markRecurringAsDone(u)}>支払済みにする</button>
                          </div>
                        ) : (
                          <span>-{yen(-u.amount).replace("-", "")}</span>
                        )}
                        
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

      {tab === "calendar" && (
        <div>
          <div className="mk-header"><h1>未来カレンダー</h1></div>
          <div className="mk-screen">
            <div className="mk-calendar-shell">
              <div className="mk-calendar-head">
                <button className="mk-calendar-nav" onClick={() => moveCalendarMonth(-1)} aria-label="前の月"><ChevronLeft size={18} /></button>
                <div className="mk-calendar-month">{monthLabel(calendarMonth)}</div>
                <button className="mk-calendar-nav" onClick={() => moveCalendarMonth(1)} aria-label="次の月"><ChevronRight size={18} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button className="mk-calendar-today" onClick={goCalendarToday}>今月に戻る</button>
              </div>

              <div className="mk-calendar-stats">
                <div className="mk-calendar-stat">
                  <div className="mk-calendar-stat-label">入金予定</div>
                  <div className="mk-calendar-stat-value" style={{ color: 'var(--bill)' }}>+{yen(calendarMonthStats.income).replace("-", "")}</div>
                </div>
                <div className="mk-calendar-stat">
                  <div className="mk-calendar-stat-label">支出予定</div>
                  <div className="mk-calendar-stat-value" style={{ color: 'var(--danger)' }}>-{yen(calendarMonthStats.expense).replace("-", "")}</div>
                </div>
              </div>

              <div className="mk-calendar-weekdays">
                {["日", "月", "火", "水", "木", "金", "土"].map((w) => <div key={w} className="mk-calendar-weekday">{w}</div>)}
              </div>
              <div className="mk-calendar-grid">
                {calendarGrid.map((cell, index) => {
                  if (!cell) return <div key={`blank-${index}`} />;
                  const isSelected = calendarSelectedDate === cell.key;
                  const isToday = cell.key === todayStr();
                  const dots = cell.events.slice(0, 3);
                  return (
                    <button
                      key={cell.key}
                      className={`mk-calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                      onClick={() => setCalendarSelectedDate(cell.key)}
                      aria-label={`${cell.day}日 ${cell.events.length}件の予定`}
                    >
                      <span className="mk-calendar-day-number">{cell.day}</span>
                      <span className="mk-calendar-dots">
                        {dots.map((ev) => (
                          <span
                            key={ev.id}
                            className={`mk-calendar-dot ${ev.amount > 0 ? (ev.overdue ? "alert" : "income") : "expense"}`}
                          />
                        ))}
                        {cell.events.length > 3 && <span className="mk-calendar-more">+{cell.events.length - 3}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mk-calendar-note">緑＝入金、赤＝支出、オレンジ＝入金予定日超過・未確認。同日の予定は安全側に倒して支出を先に扱います。</div>
              {calendarMonthStats.overdueIncomeCount > 0 && (
                <div className="mk-calendar-warning">
                  <AlertTriangle size={14} />
                  <span>期限を過ぎた未確認の入金が{calendarMonthStats.overdueIncomeCount}件あります。安全のため入金予定合計と未来残高の計算には含めません。</span>
                </div>
              )}
            </div>

            <div className="mk-calendar-detail">
              <div className="mk-calendar-detail-head">
                <span className="mk-calendar-detail-date">{fmtDateFull(new Date(calendarSelectedDate + "T00:00:00"))}</span>
                <span className="mk-calendar-detail-count">{selectedCalendarEvents.length}件</span>
              </div>

              {selectedCalendarEvents.length === 0 ? (
                <div className="mk-empty-note" style={{ padding: '18px 8px' }}>この日の予定はありません</div>
              ) : (
                selectedCalendarEvents.map((ev) => (
                  <div key={ev.id} className="mk-calendar-event">
                    <span
                      className="mk-calendar-event-mark"
                      style={{ background: ev.amount > 0 ? (ev.overdue ? 'var(--alert)' : 'var(--bill)') : 'var(--danger)' }}
                    />
                    <div className="mk-calendar-event-main">
                      <div className="mk-calendar-event-name">{ev.label}{ev.recurring ? "（定期）" : ""}</div>
                      <div className="mk-calendar-event-meta">
                        {ev.sourceLabel} ・ {ev.accountName}
                        {ev.overdue && ev.amount > 0 ? " ・ 入金予定日超過・計算除外" : ev.overdue ? " ・ 期限超過" : ""}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                      <span className="mk-calendar-event-amount" style={{ color: ev.amount > 0 ? (ev.overdue ? 'var(--ink-soft)' : 'var(--bill)') : 'var(--danger)' }}>
                        {ev.amount > 0 ? "+" : "-"}{yen(Math.abs(ev.amount)).replace("-", "")}
                      </span>
                      <div className="mk-calendar-event-actions">
                        {ev.type === 'payment' && (
                          <button className="mk-mini-btn" onClick={() => markAsPaid(ev.cardId, ev.paymentMonth)}>支払済み</button>
                        )}
                        {ev.type === 'income' && ev.recurring && (
                          <button className="mk-mini-btn" onClick={() => markRecurringAsDone(ev)}>入金済み</button>
                        )}
                        {ev.type === 'expense' && ev.recurring && (
                          <button className="mk-mini-btn" onClick={() => markRecurringAsDone(ev)}>支払済み</button>
                        )}
                        {ev.type === 'income' && !ev.recurring && (
                          <button className="mk-mini-btn" onClick={() => markIncomeAsReceived(ev.original)}>入金済み</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "wallet" && (
        <div>
          <div className="mk-header"><h1>財布</h1></div>
          <div className="mk-screen">
            
            <div className={`mk-hero mk-hero-${heroState.type}`} style={{ marginBottom: 24 }}>
              <div className="mk-hero-top">
                <span className="mk-hero-label" style={{ color: "inherit" }}>
                  <Wallet size={16} /> 自由に使える金額
                </span>
              </div>
              <div className="mk-hero-amount" style={{ color: "inherit" }}>{yen(freeMoney)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13.5px", fontWeight: "bold", marginTop: "4px" }}>
                {heroState.icon} <span>{heroState.label}</span>
              </div>
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

            <div className="mk-section-title">データ管理</div>
            <div className="mk-equation mk-data-tools">
              <div className="mk-data-tools-row">
                <button className="mk-btn mk-btn-ghost" onClick={exportBackup}>
                  <Download size={15} style={{ marginRight: 6 }} /> バックアップ
                </button>
                <label className="mk-btn mk-btn-ghost mk-file-btn" style={{ textAlign: "center" }}>
                  <Upload size={15} style={{ marginRight: 6, verticalAlign: "middle" }} /> 復元
                  <input type="file" accept=".json,application/json" onChange={importBackup} />
                </label>
              </div>
              <div className="mk-backup-note">
                バックアップはこの端末にJSONファイルとして保存されます。復元すると現在のデータを置き換えます。ファイルには口座名・残高・利用明細などが含まれるため、他人と共有しないでください。
              </div>
              {backupMessage && (
                <div className={`mk-backup-message ${backupMessage.type}`}>{backupMessage.text}</div>
              )}
            </div>

            <div className="mk-section-title">未来の資金推移</div>
            <div className="mk-equation">
              {fundsTransition.map((r, i) => (
                <div key={i} className="mk-transition-row">
                  <span className={`mk-transition-label ${r.label === "期限超過" ? "danger" : ""}`}>{r.label}</span>
                  {r.name && (
                    <span style={{ fontSize: '11px', color: r.isOverdueIncome ? 'var(--alert)' : 'var(--ink-soft)', marginLeft: '4px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.isOverdueIncome && <AlertTriangle size={10} style={{marginRight: 2}} />}
                      {r.name}
                    </span>
                  )}
                  {r.delta !== undefined && (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: r.isOverdueIncome ? 'var(--ink-soft)' : (r.delta > 0 ? 'var(--bill)' : 'var(--danger)'), margin: '0 8px' }}>
                      {r.isOverdueIncome ? '(計算除外)' : `${r.delta > 0 ? '+' : ''}${yen(r.delta)}`}
                    </span>
                  )}
                  <span className={`mk-transition-amount ${r.amount < 0 ? "negative" : ""}`}>{yen(r.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {cards.length > 0 && !modal && (
        <button
          className="mk-quick-fab"
          onClick={() => setModal({ type: "quickTx" })}
          aria-label="カード利用をクイック登録"
        >
          <Plus size={18} /> 利用登録
        </button>
      )}

      {undoEntry && !modal && (
        <div className="mk-undo-toast" role="status" aria-live="polite">
          <span className="mk-undo-toast-text">{undoEntry.label}</span>
          <button className="mk-undo-action" onClick={undoLastChange}>取り消す</button>
          <button className="mk-undo-close" onClick={() => setUndoEntry(null)} aria-label="取り消し通知を閉じる">
            <X size={15} />
          </button>
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
        <button className={`mk-nav-btn ${tab === "calendar" ? "active" : ""}`} onClick={() => setTab("calendar")}>
          <CalendarDays size={20} /> 予定
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
      {modal?.type === "quickTx" && (
        <Modal title="クイック利用登録" onClose={() => setModal(null)}>
          <QuickTransactionForm
            cards={cards}
            presetCardId={lastUsedCardId}
            onSave={saveTransaction}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === "addLog" && (
        <Modal title="入出金を記録" onClose={() => setModal(null)}>
          <AccountLogForm onSave={(log) => addAccountLog(modal.payload, log)} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "addIncome" && (
        <Modal title="収入予定を追加" onClose={() => setModal(null)}>
          <IncomeForm accounts={accounts} onSave={saveIncome} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "addRecurring" && (
        <Modal title="定期予定を追加" onClose={() => setModal(null)}>
          <RecurringRuleForm accounts={accounts} onSave={saveRecurringRule} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "editRecurring" && (
        <Modal title="定期予定を編集" onClose={() => setModal(null)}>
          <RecurringRuleForm initial={modal.payload} accounts={accounts} onSave={saveRecurringRule} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}