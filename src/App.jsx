import { useMemo, useState } from 'react'

const RATE = 0.35

const emptyClient = {
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

export default function App() {
  const [clients, setClients] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [form, setForm] = useState({
    ...emptyClient,
    clientNo: 'JP-0001',
    loanDate: today(),
    dueDate: plus30(today())
  })
  const [selectedClientNo, setSelectedClientNo] = useState('')

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
      approved,
      employmentOk,
      verificationOk,
      affordabilityOk,
      loanRangeOk
    }
  }

  function saveClient() {
  const exists = clients.some(client => client.clientNo === form.clientNo)

  if (exists) {
    setClients(clients.map(client =>
      client.clientNo === form.clientNo ? form : client
    ))
  } else {
    setClients([form, ...clients])
  }

  setSelectedClientNo(form.clientNo)
  setActiveTab('logs')
}
  function editClient(client) {
  setForm(client)
  setSelectedClientNo(client.clientNo)
  setActiveTab('capture')
}

  function updatePayment(clientNo, amountPaid) {
    setClients(clients.map(client =>
      client.clientNo === clientNo
        ? { ...client, amountPaid }
        : client
    ))
  }

  function deleteClient(clientNo) {
    setClients(clients.filter(client => client.clientNo !== clientNo))
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

  return (
    <div style={page}>
      <header style={header}>
        <div>
          <h1 style={title}>JPrime Finance</h1>
          <p style={subtitle}>Loan Management System</p>
        </div>
        <div style={badge}>Fast • Simple • Reliable</div>
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

            <SelectField
              label="Employment Status"
              value={form.employmentStatus}
              onChange={v => update('employmentStatus', v)}
              options={['Permanent', 'Contract', 'Temporary', 'Self Employed']}
            />

            <Field label="Months Employed" value={form.monthsEmployed} onChange={v => update('monthsEmployed', v)} />
            <Field label="Gross Salary" value={form.grossSalary} onChange={v => update('grossSalary', v)} />
            <Field label="Net Salary" value={form.netSalary} onChange={v => update('netSalary', v)} />
            <Field label="Requested Loan Amount" value={form.loanAmount} onChange={v => update('loanAmount', v)} />
            <Field label="Loan Date" type="date" value={form.loanDate} onChange={v => update('loanDate', v)} />
            <Field label="Due Date" type="date" value={form.dueDate} onChange={v => update('dueDate', v)} />
          </div>

          <DecisionBox calc={c} />

          <button style={primaryButton} onClick={saveClient}>
            Save Client
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
          <h2>Banking, DebiCheck & Employer Verification</h2>

          <div style={grid2}>
            <Field label="Bank Name" value={form.bankName} onChange={v => update('bankName', v)} />
            <Field label="Account Holder" value={form.accountHolder} onChange={v => update('accountHolder', v)} />
            <Field label="Account Number" value={form.accountNumber} onChange={v => update('accountNumber', v)} />

            <SelectField
              label="Account Type"
              value={form.accountType}
              onChange={v => update('accountType', v)}
              options={['Savings', 'Cheque', 'Current']}
            />

            <Field label="Branch Code" value={form.branchCode} onChange={v => update('branchCode', v)} />

            <SelectField
              label="DebiCheck Status"
              value={form.debicheckStatus}
              onChange={v => update('debicheckStatus', v)}
              options={['Pending', 'Verified', 'Failed', 'Cancelled']}
            />

            <Field label="Mandate Reference" value={form.mandateRef} onChange={v => update('mandateRef', v)} />

            <SelectField
              label="Employer Verification"
              value={form.employerVerified}
              onChange={v => update('employerVerified', v)}
              options={['Pending', 'Verified', 'Failed']}
            />
          </div>
        </section>
      )}

      {activeTab === 'logs' && (
        <section style={card}>
          <h2>Client Logs</h2>

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
                  <tr key={client.clientNo}>
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
                      <button onClick={() => setSelectedClientNo(client.clientNo)}>
                        Select
                      </button>
                      <button onClick={() => deleteClient(client.clientNo)}>
                        Delete
                      </button>
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

          {!selectedClient ? (
            <p>No client selected.</p>
          ) : (
            <Agreement client={selectedClient} calc={calc(selectedClient)} />
          )}
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
                  <tr key={client.clientNo}>
                    <td>{client.clientNo}</td>
                    <td>{client.name}</td>
                    <td>{money(result.totalRepayable)}</td>
                    <td>
                      <input
                        value={client.amountPaid}
                        onChange={e => updatePayment(client.clientNo, e.target.value)}
                      />
                    </td>
                    <td>{money(result.balance)}</td>
                    <td>
                      {result.balance <= 0 ? 'PAID' : 'OUTSTANDING'}
                    </td>
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
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={input}
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={labelStyle}>
      {label}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={input}
      >
        {options.map(option => (
          <option key={option}>{option}</option>
        ))}
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

      <p>
        The Borrower agrees to repay the total amount on or before the repayment date.
        The Borrower confirms that the information provided is true and correct.
      </p>

      <br />
      <p>Borrower Signature: __________________________</p>
      <p>Representative Signature: _____________________</p>

      <button onClick={() => window.print()} style={primaryButton}>
        Print Agreement
      </button>
    </div>
  )
}

const page = {
  fontFamily: 'Arial',
  background: '#f4f6f4',
  minHeight: '100vh',
  padding: 25
}

const header = {
  background: '#063d27',
  color: 'white',
  padding: 25,
  borderRadius: 18,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const title = {
  margin: 0,
  color: '#c9a23f'
}

const subtitle = {
  margin: 0
}

const badge = {
  background: '#c9a23f',
  color: '#000',
  padding: '10px 18px',
  borderRadius: 25,
  fontWeight: 'bold'
}

const tabs = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 20
}

const tab = {
  padding: '10px 15px',
  border: '1px solid #ccc',
  borderRadius: 8,
  background: 'white',
  cursor: 'pointer'
}

const tabActive = {
  ...tab,
  background: '#063d27',
  color: 'white'
}

const card = {
  background: 'white',
  padding: 25,
  borderRadius: 18,
  marginTop: 20,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
}

const grid2 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 15
}

const grid4 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 15
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  fontWeight: 'bold'
}

const input = {
  marginTop: 6,
  padding: 12,
  borderRadius: 8,
  border: '1px solid #ccc'
}

const primaryButton = {
  marginTop: 20,
  background: '#063d27',
  color: 'white',
  padding: '12px 20px',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 'bold'
}

const statBox = {
  background: '#063d27',
  color: 'white',
  padding: 20,
  borderRadius: 15
}

const approveBox = {
  background: '#d9ead3',
  padding: 18,
  borderRadius: 15,
  marginTop: 20
}

const declineBox = {
  background: '#f4cccc',
  padding: 18,
  borderRadius: 15,
  marginTop: 20
}

const summaryBox = {
  background: '#fff2cc',
  padding: 18,
  borderRadius: 15,
  marginTop: 20
}

const table = {
  width: '100%',
  borderCollapse: 'collapse'
}

const approvedBadge = {
  background: '#0b6b3a',
  color: 'white',
  padding: '5px 10px',
  borderRadius: 8
}

const declinedBadge = {
  background: '#b00020',
  color: 'white',
  padding: '5px 10px',
  borderRadius: 8
}

const agreementBox = {
  border: '1px solid #ccc',
  borderRadius: 15,
  padding: 25
}
