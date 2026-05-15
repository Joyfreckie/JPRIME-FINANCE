import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'

const RATE = 0.35

const emptyClient = {
  id: null,
  clientNo: '',
  name: '',
  idNumber: '',
  phone: '',
  address: '',
  nokName: '',
  nokPhone: '',
  employer: '',
  employmentStatus: 'Permanent',
  monthsEmployed: '',
  grossSalary: '',
  netSalary: '',
  rent: '',
  groceries: '',
  transport: '',
  debitOrders: '',
  existingLoans: '',
  otherExpenses: '',
  loanAmount: '',
  loanDate: '',
  dueDate: '',
  amountPaid: '',
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  accountType: 'Savings',
  branchCode: '',
  debicheckStatus: 'Pending',
  mandateRef: '',
  employerVerified: 'Pending',
  bureauStatus: 'Not Checked',
  notes: ''
}

function money(value) {
  return `R ${Number(value || 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function plus30(date) {
  const d = new Date(date || today())
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

function nextClientNo(clients) {
  return `JP-${String(clients.length + 1).padStart(4, '0')}`
}

function toDb(client, userId) {
  return {
    user_id: userId,
    client_no: client.clientNo,
    name: client.name,
    id_number: client.idNumber,
    phone: client.phone,
    address: client.address,
    nok_name: client.nokName,
    nok_phone: client.nokPhone,
    employer: client.employer,
    employment_status: client.employmentStatus,
    months_employed: client.monthsEmployed,
    gross_salary: Number(client.grossSalary || 0),
    net_salary: Number(client.netSalary || 0),
    rent: Number(client.rent || 0),
    groceries: Number(client.groceries || 0),
    transport: Number(client.transport || 0),
    debit_orders: Number(client.debitOrders || 0),
    existing_loans: Number(client.existingLoans || 0),
    other_expenses: Number(client.otherExpenses || 0),
    loan_amount: Number(client.loanAmount || 0),
    loan_date: client.loanDate || today(),
    due_date: client.dueDate || plus30(today()),
    amount_paid: Number(client.amountPaid || 0),
    bank_name: client.bankName,
    account_holder: client.accountHolder,
    account_number: client.accountNumber,
    account_type: client.accountType,
    branch_code: client.branchCode,
    debicheck_status: client.debicheckStatus,
    mandate_ref: client.mandateRef,
    employer_verified: client.employerVerified,
    bureau_status: client.bureauStatus,
    notes: client.notes
  }
}

function fromDb(row) {
  return {
    id: row.id,
    clientNo: row.client_no || '',
    name: row.name || '',
    idNumber: row.id_number || '',
    phone: row.phone || '',
    address: row.address || '',
    nokName: row.nok_name || '',
    nokPhone: row.nok_phone || '',
    employer: row.employer || '',
    employmentStatus: row.employment_status || 'Permanent',
    monthsEmployed: row.months_employed || '',
    grossSalary: row.gross_salary || '',
    netSalary: row.net_salary || '',
    rent: row.rent || '',
    groceries: row.groceries || '',
    transport: row.transport || '',
    debitOrders: row.debit_orders || '',
    existingLoans: row.existing_loans || '',
    otherExpenses: row.other_expenses || '',
    loanAmount: row.loan_amount || '',
    loanDate: row.loan_date || today(),
    dueDate: row.due_date || plus30(today()),
    amountPaid: row.amount_paid || '',
    bankName: row.bank_name || '',
    accountHolder: row.account_holder || '',
    accountNumber: row.account_number || '',
    accountType: row.account_type || 'Savings',
    branchCode: row.branch_code || '',
    debicheckStatus: row.debicheck_status || 'Pending',
    mandateRef: row.mandate_ref || '',
    employerVerified: row.employer_verified || 'Pending',
    bureauStatus: row.bureau_status || 'Not Checked',
    notes: row.notes || ''
  }
}

export default function App() {
  const [session, setSession] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [clients, setClients] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedClientNo, setSelectedClientNo] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    ...emptyClient,
    clientNo: 'JP-0001',
    loanDate: today(),
    dueDate: plus30(today())
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      loadClients()
    }
  }, [session])

  async function handleAuth() {
    setAuthMessage('')
    setLoading(true)

    const result =
      authMode === 'login'
        ? await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword
          })
        : await supabase.auth.signUp({
            email: authEmail,
            password: authPassword
          })

    if (result.error) {
      setAuthMessage(result.error.message)
    } else {
      setAuthMessage(
        authMode === 'login'
          ? 'Login successful.'
          : 'Account created. Check email if confirmation is required.'
      )
    }

    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setClients([])
  }

  async function loadClients() {
    setLoading(true)

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setClients(data.map(fromDb))
    }

    setLoading(false)
  }

  async function logAction(action, recordId) {
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action,
      table_name: 'clients',
      record_id: recordId || null
    })
  }

  function update(field, value) {
    const updated = { ...form, [field]: value }

    if (field === 'loanDate') {
      updated.dueDate = plus30(value)
    }

    setForm(updated)
  }

  function calc(client) {
    const totalExpenses =
      Number(client.rent || 0) +
      Number(client.groceries || 0) +
      Number(client.transport || 0) +
      Number(client.debitOrders || 0) +
      Number(client.existingLoans || 0) +
      Number(client.otherExpenses || 0)

    const disposable = Number(client.netSalary || 0) - totalExpenses
    const loanAmount = Number(client.loanAmount || 0)
    const fee = loanAmount * RATE
    const totalRepayable = loanAmount + fee
    const balance = totalRepayable - Number(client.amountPaid || 0)

    const employmentOk =
      client.employmentStatus === 'Permanent' &&
      Number(client.monthsEmployed || 0) >= 3

    const verificationOk =
      client.employerVerified === 'Verified' &&
      client.debicheckStatus === 'Verified'

    const affordabilityOk = disposable >= totalRepayable
    const loanRangeOk = loanAmount >= 1000 && loanAmount <= 4000

    const approved =
      employmentOk && verificationOk && affordabilityOk && loanRangeOk

    return {
      totalExpenses,
      disposable,
      fee,
      totalRepayable,
      balance,
      approved
    }
  }

  async function saveClient() {
    if (!session?.user) return alert('Please login first.')

    setLoading(true)

    const payload = toDb(form, session.user.id)

    if (form.id) {
      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', form.id)

      if (error) {
        alert(error.message)
      } else {
        await logAction('updated client', form.id)
        await loadClients()
        setActiveTab('logs')
      }
    } else {
      const { data, error } = await supabase
        .from('clients')
        .insert(payload)
        .select()
        .single()

      if (error) {
        alert(error.message)
      } else {
        await logAction('created client', data.id)
        await loadClients()
        setSelectedClientNo(data.client_no)
        setActiveTab('logs')
      }
    }

    setLoading(false)
  }

  function newClient() {
    setForm({
      ...emptyClient,
      clientNo: nextClientNo(clients),
      loanDate: today(),
      dueDate: plus30(today())
    })
    setSelectedClientNo('')
    setActiveTab('capture')
  }

  function editClient(client) {
    setForm(client)
    setSelectedClientNo(client.clientNo)
    setActiveTab('capture')
  }

  function selectClient(clientNo) {
    setSelectedClientNo(clientNo)
    setActiveTab('agreement')
  }

  async function updatePayment(client, amountPaid) {
    const updated = { ...client, amountPaid }

    const { error } = await supabase
      .from('clients')
      .update(toDb(updated, session.user.id))
      .eq('id', client.id)

    if (error) {
      alert(error.message)
    } else {
      await logAction('updated payment', client.id)
      await loadClients()
    }
  }

  async function deleteClient(client) {
    if (!confirm('Delete this client?')) return

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', client.id)

    if (error) {
      alert(error.message)
    } else {
      await logAction('deleted client', client.id)
      await loadClients()
    }
  }

  function openExperian() {
    window.open(
      'https://www.experian.co.za/consumer/my-free-credit-check-and-your-free-credit-report',
      '_blank'
    )
  }

  const selectedClient =
    clients.find(client => client.clientNo === selectedClientNo) || clients[0]

  const dashboard = useMemo(() => {
    return clients.reduce(
      (summary, client) => {
        const c = calc(client)
        summary.totalClients += 1
        summary.approved += c.approved ? 1 : 0
        summary.declined += c.approved ? 0 : 1
        summary.totalLoans += Number(client.loanAmount || 0)
        summary.outstanding += Math.max(0, c.balance)
        return summary
      },
      {
        totalClients: 0,
        approved: 0,
        declined: 0,
        totalLoans: 0,
        outstanding: 0
      }
    )
  }, [clients])

  const c = calc(form)

  if (!session) {
    return (
      <div style={loginBackground}>
        <div style={loginCard}>
          <div style={logoCircle}>JP</div>

          <h1 style={loginTitle}>JPrime Finance</h1>
          <p style={loginSubtitle}>Secure Loan Management Platform</p>

          <h2 style={loginHeading}>
            {authMode === 'login' ? 'Secure Login' : 'Create Staff Account'}
          </h2>

          <div style={loginFields}>
            <input
              style={loginInput}
              placeholder="Email address"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
            />

            <input
              style={loginInput}
              placeholder="Password"
              type="password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
            />

            <button style={loginButton} onClick={handleAuth} disabled={loading}>
              {loading ? 'Please wait...' : authMode === 'login' ? 'Login Securely' : 'Create Account'}
            </button>

            <button
              style={signupButton}
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            >
              {authMode === 'login' ? 'Create New Staff Account' : 'Back to Login'}
            </button>
          </div>

          {authMessage && <p style={authNotice}>{authMessage}</p>}

          <p style={loginFooter}>
            Protected access enabled. Client information is stored securely in Supabase cloud infrastructure.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={page}>
      <header style={header}>
        <div>
          <h1 style={title}>JPrime Finance</h1>
          <p style={subtitle}>Secure Loan Management System</p>
          <p style={subtitle}>Logged in: {session.user.email}</p>
        </div>
        <button style={goldButton} onClick={logout}>Logout</button>
      </header>

      <nav style={tabs}>
        {[
          ['dashboard', 'Dashboard'],
          ['capture', 'Client Capture'],
          ['expenses', 'Expenses'],
          ['banking', 'Banking & DebiCheck'],
          ['logs', 'Client Logs'],
          ['agreement', 'Loan Agreement'],
          ['payments', 'Payment Tracker']
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={activeTab === key ? tabActive : tab}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && (
        <section style={card}>
          <h2>Dashboard</h2>
          <div style={grid4}>
            <Stat title="Total Clients" value={dashboard.totalClients} />
            <Stat title="Approved" value={dashboard.approved} />
            <Stat title="Declined" value={dashboard.declined} />
            <Stat title="Outstanding" value={money(dashboard.outstanding)} />
          </div>

          <button style={primaryButton} onClick={newClient}>New Client Application</button>
          <button style={goldButton} onClick={openExperian}>Open Free Experian Credit Report</button>
        </section>
      )}

      {activeTab === 'capture' && (
        <section style={card}>
          <h2>Personal & Employment Details</h2>
          <div style={grid2}>
            <Field label="Client No" value={form.clientNo} onChange={v => update('clientNo', v)} />
            <Field label="Full Name" value={form.name} onChange={v => update('name', v)} />
            <Field label="ID Number" value={form.idNumber} onChange={v => update('idNumber', v)} />
            <Field label="Cell Number" value={form.phone} onChange={v => update('phone', v)} />
            <Field label="Physical Address" value={form.address} onChange={v => update('address', v)} />
            <Field label="Next of Kin" value={form.nokName} onChange={v => update('nokName', v)} />
            <Field label="NOK Contact" value={form.nokPhone} onChange={v => update('nokPhone', v)} />
            <Field label="Employer" value={form.employer} onChange={v => update('employer', v)} />
            <SelectField label="Employment Status" value={form.employmentStatus} onChange={v => update('employmentStatus', v)} options={['Permanent', 'Contract', 'Temporary', 'Self Employed']} />
            <Field label="Months Employed" value={form.monthsEmployed} onChange={v => update('monthsEmployed', v)} />
            <Field label="Gross Salary" value={form.grossSalary} onChange={v => update('grossSalary', v)} />
            <Field label="Net Salary" value={form.netSalary} onChange={v => update('netSalary', v)} />
            <Field label="Requested Loan Amount" value={form.loanAmount} onChange={v => update('loanAmount', v)} />
            <Field label="Loan Date" type="date" value={form.loanDate} onChange={v => update('loanDate', v)} />
            <Field label="Due Date" type="date" value={form.dueDate} onChange={v => update('dueDate', v)} />
          </div>

          <DecisionBox calc={c} />

          <button style={primaryButton} onClick={saveClient}>
            {form.id ? 'Update Client Online' : 'Save Client Online'}
          </button>
        </section>
      )}

      {activeTab === 'expenses' && (
        <section style={card}>
          <h2>Expense Breakdown</h2>
          <div style={grid2}>
            <Field label="Rent / Bond" value={form.rent} onChange={v => update('rent', v)} />
            <Field label="Groceries" value={form.groceries} onChange={v => update('groceries', v)} />
            <Field label="Transport" value={form.transport} onChange={v => update('transport', v)} />
            <Field label="Debit Orders" value={form.debitOrders} onChange={v => update('debitOrders', v)} />
            <Field label="Existing Loans" value={form.existingLoans} onChange={v => update('existingLoans', v)} />
            <Field label="Other Expenses" value={form.otherExpenses} onChange={v => update('otherExpenses', v)} />
          </div>
          <div style={summaryBox}>
            <p><b>Total Expenses:</b> {money(c.totalExpenses)}</p>
            <p><b>Disposable Income:</b> {money(c.disposable)}</p>
          </div>
        </section>
      )}

      {activeTab === 'banking' && (
        <section style={card}>
          <h2>Banking, DebiCheck, Employer & Bureau Verification</h2>
          <div style={grid2}>
            <Field label="Bank Name" value={form.bankName} onChange={v => update('bankName', v)} />
            <Field label="Account Holder" value={form.accountHolder} onChange={v => update('accountHolder', v)} />
            <Field label="Account Number" value={form.accountNumber} onChange={v => update('accountNumber', v)} />
            <SelectField label="Account Type" value={form.accountType} onChange={v => update('accountType', v)} options={['Savings', 'Cheque', 'Current']} />
            <Field label="Branch Code" value={form.branchCode} onChange={v => update('branchCode', v)} />
            <SelectField label="DebiCheck Status" value={form.debicheckStatus} onChange={v => update('debicheckStatus', v)} options={['Pending', 'Verified', 'Failed', 'Cancelled']} />
            <Field label="Mandate Reference" value={form.mandateRef} onChange={v => update('mandateRef', v)} />
            <SelectField label="Employer Verification" value={form.employerVerified} onChange={v => update('employerVerified', v)} options={['Pending', 'Verified', 'Failed']} />
            <SelectField label="Credit Bureau Status" value={form.bureauStatus} onChange={v => update('bureauStatus', v)} options={['Not Checked', 'Client Report Received', 'Clear', 'Risky', 'Declined']} />
          </div>

          <button style={goldButton} onClick={openExperian}>
            Open Free Experian Credit Report
          </button>

          <p style={smallText}>
            POPIA note: Client must consent before any credit, employment, or banking verification.
          </p>
        </section>
      )}

      {activeTab === 'logs' && (
        <section style={card}>
          <h2>Client Logs</h2>
          {loading && <p>Loading...</p>}

          <table style={table}>
            <thead>
              <tr>
                <th>Client No</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Loan</th>
                <th>Total Repayable</th>
                <th>Decision</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => {
                const result = calc(client)
                return (
                  <tr key={client.id}>
                    <td>{client.clientNo}</td>
                    <td>{client.name}</td>
                    <td>{client.phone}</td>
                    <td>{money(client.loanAmount)}</td>
                    <td>{money(result.totalRepayable)}</td>
                    <td>
                      <span style={result.approved ? approvedBadge : declinedBadge}>
                        {result.approved ? 'APPROVED' : 'DECLINED'}
                      </span>
                    </td>
                    <td>
                      <button style={editButton} onClick={() => editClient(client)}>Edit</button>
                      <button style={selectButton} onClick={() => selectClient(client.clientNo)}>Agreement</button>
                      <button style={deleteButton} onClick={() => deleteClient(client)}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'agreement' && (
        <section style={card}>
          <h2>Auto Loan Agreement</h2>
          {!selectedClient ? <p>No client selected.</p> : <Agreement client={selectedClient} calc={calc(selectedClient)} />}
        </section>
      )}

      {activeTab === 'payments' && (
        <section style={card}>
          <h2>Payment Tracker</h2>
          <table style={table}>
            <thead>
              <tr>
                <th>Client No</th>
                <th>Name</th>
                <th>Total Repayable</th>
                <th>Amount Paid</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => {
                const result = calc(client)
                return (
                  <tr key={client.id}>
                    <td>{client.clientNo}</td>
                    <td>{client.name}</td>
                    <td>{money(result.totalRepayable)}</td>
                    <td>
                      <input
                        defaultValue={client.amountPaid}
                        onBlur={e => updatePayment(client, e.target.value)}
                      />
                    </td>
                    <td>{money(result.balance)}</td>
                    <td>{result.balance <= 0 ? 'PAID' : 'OUTSTANDING'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label style={labelStyle}>
      {label}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={input} />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={labelStyle}>
      {label}
      <select value={value} onChange={e => onChange(e.target.value)} style={input}>
        {options.map(option => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Stat({ title, value }) {
  return (
    <div style={statBox}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  )
}

function DecisionBox({ calc }) {
  return (
    <div style={calc.approved ? approveBox : declineBox}>
      <h3>{calc.approved ? 'APPROVED' : 'DECLINED'}</h3>
      <p>Total Expenses: {money(calc.totalExpenses)}</p>
      <p>Disposable Income: {money(calc.disposable)}</p>
      <p>Service Fee 35%: {money(calc.fee)}</p>
      <p>Total Repayable: {money(calc.totalRepayable)}</p>
    </div>
  )
}

function Agreement({ client, calc }) {
  return (
    <div style={agreementBox}>
      <h2>JPrime Finance</h2>
      <p>A division of J.PRIME SOLUTIONS (PTY) LTD</p>
      <h3>Short-Term Loan Agreement</h3>
      <p><b>Client No:</b> {client.clientNo}</p>
      <p><b>Borrower:</b> {client.name}</p>
      <p><b>ID Number:</b> {client.idNumber}</p>
      <p><b>Cell:</b> {client.phone}</p>
      <p><b>Employer:</b> {client.employer}</p>
      <p><b>Loan Amount:</b> {money(client.loanAmount)}</p>
      <p><b>Service Fee 35%:</b> {money(calc.fee)}</p>
      <p><b>Total Repayable:</b> {money(calc.totalRepayable)}</p>
      <p><b>Repayment Date:</b> {client.dueDate}</p>
      <p><b>Bank:</b> {client.bankName}</p>
      <p><b>DebiCheck Status:</b> {client.debicheckStatus}</p>

      <p>
        The Borrower agrees to repay the total amount on or before the repayment date.
        The Borrower confirms that the information provided is true and correct.
      </p>

      <p>Borrower Signature: __________________________</p>
      <p>Representative Signature: _____________________</p>

      <button onClick={() => window.print()} style={primaryButton}>Print Agreement</button>
    </div>
  )
}

const loginBackground = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background:
    'linear-gradient(135deg, rgba(2,44,26,0.95), rgba(0,0,0,0.82)), radial-gradient(circle at top left, #c9a23f 0, transparent 35%), radial-gradient(circle at bottom right, #0b6b3a 0, transparent 35%)',
  backgroundColor: '#063d27',
  padding: 25,
  fontFamily: 'Arial'
}

const loginCard = {
  width: '100%',
  maxWidth: 520,
  background: 'rgba(255,255,255,0.13)',
  backdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: 28,
  padding: 45,
  boxShadow: '0 25px 80px rgba(0,0,0,0.45)',
  color: 'white'
}

const logoCircle = {
  width: 70,
  height: 70,
  borderRadius: '50%',
  background: '#c9a23f',
  color: '#063d27',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 26,
  fontWeight: 'bold',
  marginBottom: 20
}

const loginTitle = {
  fontSize: 44,
  margin: 0,
  color: '#c9a23f',
  fontWeight: 800
}

const loginSubtitle = {
  marginTop: 8,
  color: '#e8e8e8',
  fontSize: 15
}

const loginHeading = {
  fontSize: 30,
  marginTop: 35,
  marginBottom: 22
}

const loginFields = {
  display: 'flex',
  flexDirection: 'column',
  gap: 15
}

const loginInput = {
  padding: 16,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.25)',
  background: 'rgba(255,255,255,0.12)',
  color: 'white',
  fontSize: 16,
  outline: 'none'
}

const loginButton = {
  background: '#063d27',
  color: 'white',
  padding: 16,
  border: 'none',
  borderRadius: 14,
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: 16
}

const signupButton = {
  background: '#c9a23f',
  color: '#000',
  padding: 16,
  border: 'none',
  borderRadius: 14,
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: 16
}

const authNotice = {
  marginTop: 18,
  background: 'rgba(255,255,255,0.15)',
  padding: 12,
  borderRadius: 10
}

const loginFooter = {
  marginTop: 25,
  color: '#ddd',
  fontSize: 13,
  lineHeight: 1.6
}

const page = { fontFamily: 'Arial', background: '#f4f6f4', minHeight: '100vh', padding: 25 }
const header = { background: '#063d27', color: 'white', padding: 25, borderRadius: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const title = { margin: 0, color: '#c9a23f' }
const subtitle = { margin: 0 }
const tabs = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }
const tab = { padding: '10px 15px', border: '1px solid #ccc', borderRadius: 8, background: 'white', cursor: 'pointer' }
const tabActive = { ...tab, background: '#063d27', color: 'white' }
const card = { background: 'white', padding: 25, borderRadius: 18, marginTop: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15 }
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 15 }
const labelStyle = { display: 'flex', flexDirection: 'column', fontWeight: 'bold' }
const input = { marginTop: 6, marginBottom: 12, padding: 12, borderRadius: 8, border: '1px solid #ccc' }
const primaryButton = { marginTop: 20, marginRight: 10, background: '#063d27', color: 'white', padding: '12px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }
const goldButton = { marginTop: 20, marginRight: 10, background: '#c9a23f', color: '#000', padding: '12px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }
const statBox = { background: '#063d27', color: 'white', padding: 20, borderRadius: 15 }
const approveBox = { background: '#d9ead3', padding: 18, borderRadius: 15, marginTop: 20 }
const declineBox = { background: '#f4cccc', padding: 18, borderRadius: 15, marginTop: 20 }
const summaryBox = { background: '#fff2cc', padding: 18, borderRadius: 15, marginTop: 20 }
const table = { width: '100%', borderCollapse: 'collapse' }
const approvedBadge = { background: '#0b6b3a', color: 'white', padding: '5px 10px', borderRadius: 8 }
const declinedBadge = { background: '#b00020', color: 'white', padding: '5px 10px', borderRadius: 8 }
const editButton = { background: '#063d27', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, marginRight: 6, cursor: 'pointer' }
const selectButton = { background: '#c9a23f', color: '#000', border: 'none', padding: '8px 12px', borderRadius: 8, marginRight: 6, cursor: 'pointer' }
const deleteButton = { background: '#b00020', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }
const agreementBox = { border: '1px solid #ccc', borderRadius: 15, padding: 25 }
const smallText = { fontSize: 12, color: '#555', marginTop: 10 }
