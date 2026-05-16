// FULL src/App.jsx replacement with Debit Mandate PDF support
// NOTE: Keep your existing package.json dependency: "jspdf": "^2.5.1"

import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { jsPDF } from 'jspdf'

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
  applicationStatus: 'pending',
  consentPopia: false,
  consentCreditCheck: false,
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

function addPdfHeader(doc, title) {
  doc.setFillColor(6, 61, 39)
  doc.rect(0, 0, 210, 30, 'F')

  doc.setTextColor(201, 162, 63)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('JPrime Finance', 15, 16)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text('Secure Loan Management System', 15, 24)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.text(title, 15, 45)
}

function generateLoanAgreementPDF(client, result) {
  const doc = new jsPDF()
  const fileName = `${client.clientNo || 'client'}-loan-agreement.pdf`

  addPdfHeader(doc, 'SHORT-TERM LOAN AGREEMENT')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  let y = 58

  const line = (label, value) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 15, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value || ''), 70, y)
    y += 8
  }

  line('Client No', client.clientNo)
  line('Borrower', client.name)
  line('ID Number', client.idNumber)
  line('Cell Number', client.phone)
  line('Physical Address', client.address)
  line('Employer', client.employer)
  line('Employment Status', client.employmentStatus)
  line('Loan Amount', money(client.loanAmount))
  line('Service Fee 35%', money(result.fee))
  line('Total Repayable', money(result.totalRepayable))
  line('Loan Date', client.loanDate)
  line('Repayment Date', client.dueDate)
  line('Bank', client.bankName)
  line('Account Holder', client.accountHolder)
  line('Account Number', client.accountNumber)
  line('Account Type', client.accountType)
  line('DebiCheck Status', client.debicheckStatus)
  line('Application Status', client.applicationStatus)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text('POPIA AND CREDIT CHECK CONSENT', 15, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  const consentText =
    'The Borrower confirms that all information provided is true and correct. The Borrower gives JPrime Finance consent to collect, store, process and use personal information for loan assessment, affordability verification, employment verification, banking verification, credit checks, collections and record keeping purposes.'
  doc.text(doc.splitTextToSize(consentText, 180), 15, y)
  y += 32

  line('POPIA Consent', client.consentPopia ? 'Yes' : 'No')
  line('Credit Check Consent', client.consentCreditCheck ? 'Yes' : 'No')

  y += 12
  doc.text('Borrower Signature: _______________________________', 15, y)
  y += 15
  doc.text('Representative Signature: __________________________', 15, y)
  y += 15
  doc.text('Date: _______________________', 15, y)

  doc.save(fileName)
}

function generateDebitMandatePDF(client, result) {
  const doc = new jsPDF()
  const fileName = `${client.clientNo || 'client'}-debit-mandate.pdf`

  addPdfHeader(doc, 'DEBIT ORDER / PAYMENT MANDATE')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  let y = 58

  const line = (label, value) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 15, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value || ''), 72, y)
    y += 8
  }

  line('Mandate Reference', client.mandateRef || client.clientNo)
  line('Client No', client.clientNo)
  line('Client Name', client.name)
  line('ID Number', client.idNumber)
  line('Cell Number', client.phone)
  line('Bank Name', client.bankName)
  line('Account Holder', client.accountHolder)
  line('Account Number', client.accountNumber)
  line('Account Type', client.accountType)
  line('Branch Code', client.branchCode)
  line('DebiCheck Status', client.debicheckStatus)
  line('Loan Amount', money(client.loanAmount))
  line('Total Repayable', money(result.totalRepayable))
  line('Debit / Payment Date', client.dueDate)

  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('MANDATE AUTHORISATION', 15, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  const mandateText =
    'I, the account holder/borrower, authorise JPrime Finance to use the banking details provided above for repayment collection purposes relating to this short-term loan agreement. I confirm that the account details are correct and that I understand the repayment amount and repayment date reflected in this mandate. Where a DebiCheck or debit order process is used, I understand that my authentication/approval may be required by my bank.'
  doc.text(doc.splitTextToSize(mandateText, 180), 15, y)
  y += 42

  doc.setFont('helvetica', 'bold')
  doc.text('IMPORTANT NOTICE', 15, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  const noticeText =
    'This mandate must be signed voluntarily by the client. JPrime Finance must retain this mandate with the loan agreement and POPIA consent record. Collections must comply with applicable South African law and banking rules.'
  doc.text(doc.splitTextToSize(noticeText, 180), 15, y)
  y += 28

  doc.text('Client Signature: _________________________________', 15, y)
  y += 15
  doc.text('Representative Signature: __________________________', 15, y)
  y += 15
  doc.text('Date: _______________________', 15, y)

  doc.save(fileName)
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
    application_status: client.applicationStatus,
    consent_popia: client.consentPopia,
    consent_credit_check: client.consentCreditCheck,
    notes: client.notes,
    updated_at: new Date().toISOString()
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
    applicationStatus: row.application_status || 'pending',
    consentPopia: row.consent_popia || false,
    consentCreditCheck: row.consent_credit_check || false,
    notes: row.notes || ''
  }
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [staffProfiles, setStaffProfiles] = useState([])
  const [documents, setDocuments] = useState([])
  const [documentClientId, setDocumentClientId] = useState('')
  const [documentType, setDocumentType] = useState('SA ID')
  const [uploading, setUploading] = useState(false)
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

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      ensureProfile()
      loadClients()
    }
  }, [session])

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadStaffProfiles()
    }
  }, [profile])

  async function ensureProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (data) {
      setProfile(data)

      if (data.status === 'disabled') {
        alert('Your staff account has been disabled. Please contact the administrator.')
        await logout()
      }

      return
    }

    const { data: created, error } = await supabase
      .from('profiles')
      .insert({
        id: session.user.id,
        email: session.user.email,
        role: 'staff',
        status: 'active'
      })
      .select()
      .single()

    if (error) alert(error.message)
    else setProfile(created)
  }

  async function handleAuth() {
    setAuthMessage('')
    setLoading(true)

    const result =
      authMode === 'login'
        ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
        : await supabase.auth.signUp({ email: authEmail, password: authPassword })

    setAuthMessage(
      result.error
        ? result.error.message
        : authMode === 'login'
          ? 'Login successful.'
          : 'Account created. Check email if confirmation is required.'
    )

    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setClients([])
    setStaffProfiles([])
    setDocuments([])
  }

  async function loadClients() {
    setLoading(true)

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) alert(error.message)
    else setClients(data.map(fromDb))

    setLoading(false)
  }

  async function loadStaffProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) alert(error.message)
    else setStaffProfiles(data || [])
  }

  async function updateStaffProfile(staffId, updates) {
    if (!isAdmin) return alert('Only admin can manage staff accounts.')

    const oldData = staffProfiles.find(staff => staff.id === staffId)

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', staffId)

    if (error) {
      alert(error.message)
    } else {
      await supabase.from('audit_logs').insert({
        user_id: session.user.id,
        user_email: session.user.email,
        action: 'updated staff profile',
        table_name: 'profiles',
        record_id: staffId,
        old_data: oldData,
        new_data: { ...oldData, ...updates }
      })

      await loadStaffProfiles()
      alert('Staff account updated successfully.')
    }
  }

  async function logAction(action, recordId, oldData = null, newData = null) {
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      user_email: session.user.email,
      action,
      table_name: 'clients',
      record_id: recordId || null,
      old_data: oldData,
      new_data: newData
    })
  }

  function update(field, value) {
    const updated = { ...form, [field]: value }
    if (field === 'loanDate') updated.dueDate = plus30(value)
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

    const approved =
      client.employmentStatus === 'Permanent' &&
      Number(client.monthsEmployed || 0) >= 3 &&
      client.employerVerified === 'Verified' &&
      client.debicheckStatus === 'Verified' &&
      disposable >= totalRepayable &&
      loanAmount >= 1000 &&
      loanAmount <= 4000 &&
      client.consentPopia &&
      client.consentCreditCheck

    return { totalExpenses, disposable, fee, totalRepayable, balance, approved }
  }

  async function saveClient() {
    if (!session?.user) return alert('Please login first.')
    if (!form.consentPopia) return alert('POPIA consent is required.')
    if (!form.consentCreditCheck) return alert('Credit check consent is required.')

    setLoading(true)
    const payload = toDb(form, session.user.id)

    if (form.id) {
      const oldData = clients.find(c => c.id === form.id)

      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', form.id)

      if (error) alert(error.message)
      else {
        await logAction('updated client', form.id, oldData, form)
        await loadClients()
        setActiveTab('logs')
      }
    } else {
      const { data, error } = await supabase
        .from('clients')
        .insert(payload)
        .select()
        .single()

      if (error) alert(error.message)
      else {
        await logAction('created client', data.id, null, payload)
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

    if (error) alert(error.message)
    else {
      await logAction('updated payment', client.id, client, updated)
      await loadClients()
    }
  }

  async function deleteClient(client) {
    if (!isAdmin) return alert('Only admin users can delete clients.')
    if (!confirm('Delete this client?')) return

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', client.id)

    if (error) alert(error.message)
    else {
      await logAction('deleted client', client.id, client, null)
      await loadClients()
    }
  }

  async function loadClientDocuments(clientId) {
    if (!clientId) return

    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) alert(error.message)
    else setDocuments(data || [])
  }

  async function uploadClientDocument(event) {
    const file = event.target.files[0]
    if (!file) return
    if (!documentClientId) return alert('Please select a client first.')

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const cleanDocType = documentType.replaceAll(' ', '-')
    const fileName = `${Date.now()}-${cleanDocType}.${fileExt}`
    const filePath = `${documentClientId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file)

    if (uploadError) {
      alert(uploadError.message)
      setUploading(false)
      return
    }

    const { error: dbError } = await supabase
      .from('client_documents')
      .insert({
        client_id: documentClientId,
        user_id: session.user.id,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath
      })

    if (dbError) {
      alert(dbError.message)
    } else {
      await logAction('uploaded client document', documentClientId, null, {
        document_type: documentType,
        file_name: file.name
      })

      await loadClientDocuments(documentClientId)
      alert('Document uploaded successfully.')
    }

    setUploading(false)
  }

  async function openDocument(filePath) {
    const { data, error } = await supabase.storage
      .from('client-documents')
      .createSignedUrl(filePath, 60)

    if (error) alert(error.message)
    else window.open(data.signedUrl, '_blank')
  }

  async function deleteDocument(doc) {
    if (!isAdmin) return alert('Only admin can delete documents.')
    if (!confirm('Delete this document?')) return

    const { error: storageError } = await supabase.storage
      .from('client-documents')
      .remove([doc.file_path])

    if (storageError) {
      alert(storageError.message)
      return
    }

    const { error: dbError } = await supabase
      .from('client_documents')
      .delete()
      .eq('id', doc.id)

    if (dbError) alert(dbError.message)
    else {
      await logAction('deleted client document', doc.client_id, doc, null)
      await loadClientDocuments(doc.client_id)
    }
  }

  function openExperian() {
    window.open('https://www.experian.co.za/consumer/my-free-credit-check-and-your-free-credit-report', '_blank')
  }

  const selectedClient =
    clients.find(client => client.clientNo === selectedClientNo) || clients[0]

  const dashboard = useMemo(() => {
    return clients.reduce(
      (summary, client) => {
        const c = calc(client)
        summary.totalClients += 1
        summary.approved += client.applicationStatus === 'approved' ? 1 : 0
        summary.declined += client.applicationStatus === 'declined' ? 1 : 0
        summary.totalLoans += Number(client.loanAmount || 0)
        summary.outstanding += Math.max(0, c.balance)
        return summary
      },
      { totalClients: 0, approved: 0, declined: 0, totalLoans: 0, outstanding: 0 }
    )
  }, [clients])

  const c = calc(form)

  if (!session) {
    return (
      <div style={loginBackground}>
        <div style={nodeLayer}></div>
        <div style={loginCard}>
          <div style={logoCircle}>JP</div>
          <h1 style={loginTitle}>JPrime Finance</h1>
          <p style={loginSubtitle}>Secure Loan Management Platform</p>

          <h2 style={loginHeading}>
            {authMode === 'login' ? 'Secure Login' : 'Create Staff Account'}
          </h2>

          <div style={loginFields}>
            <input style={loginInput} placeholder="Email address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            <input style={loginInput} placeholder="Password" type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />

            <button style={loginButton} onClick={handleAuth} disabled={loading}>
              {loading ? 'Please wait...' : authMode === 'login' ? 'Login Securely' : 'Create Account'}
            </button>

            <button style={signupButton} onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
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
          <p style={roleBadge}>Role: {profile?.role || 'staff'} | Status: {profile?.status || 'active'}</p>
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
          ['payments', 'Payment Tracker'],
          ['documents', 'Documents'],
          ...(isAdmin ? [['staff', 'Staff Management']] : [])
        ].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={activeTab === key ? tabActive : tab}>
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

      {activeTab === 'agreement' && (
        <section style={card}>
          <h2>Auto Loan Agreement</h2>
          {!selectedClient ? <p>No client selected.</p> : <Agreement client={selectedClient} result={calc(selectedClient)} />}
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
            <SelectField label="Application Status" value={form.applicationStatus} onChange={v => update('applicationStatus', v)} options={['pending', 'approved', 'declined', 'paid', 'overdue']} />
            <Field label="Months Employed" value={form.monthsEmployed} onChange={v => update('monthsEmployed', v)} />
            <Field label="Gross Salary" value={form.grossSalary} onChange={v => update('grossSalary', v)} />
            <Field label="Net Salary" value={form.netSalary} onChange={v => update('netSalary', v)} />
            <Field label="Requested Loan Amount" value={form.loanAmount} onChange={v => update('loanAmount', v)} />
            <Field label="Loan Date" type="date" value={form.loanDate} onChange={v => update('loanDate', v)} />
            <Field label="Due Date" type="date" value={form.dueDate} onChange={v => update('dueDate', v)} />
          </div>

          <div style={consentBox}>
            <label>
              <input type="checkbox" checked={form.consentPopia} onChange={e => update('consentPopia', e.target.checked)} />
              {' '}Client gives POPIA consent for storing and processing personal information.
            </label>

            <label>
              <input type="checkbox" checked={form.consentCreditCheck} onChange={e => update('consentCreditCheck', e.target.checked)} />
              {' '}Client gives consent for affordability, employment, banking and credit checks.
            </label>
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

          <button style={goldButton} onClick={openExperian}>Open Free Experian Credit Report</button>
          <p style={smallText}>POPIA note: Client must consent before any credit, employment, or banking verification.</p>
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
                <th>Status</th>
                <th>Loan</th>
                <th>Total Repayable</th>
                <th>Decision</th>
                <th>Consent</th>
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
                    <td>{client.applicationStatus}</td>
                    <td>{money(client.loanAmount)}</td>
                    <td>{money(result.totalRepayable)}</td>
                    <td>
                      <span style={result.approved ? approvedBadge : declinedBadge}>
                        {result.approved ? 'APPROVED' : 'DECLINED'}
                      </span>
                    </td>
                    <td>{client.consentPopia && client.consentCreditCheck ? 'YES' : 'NO'}</td>
                    <td>
                      <button style={editButton} onClick={() => editClient(client)}>Edit</button>
                      <button style={selectButton} onClick={() => selectClient(client.clientNo)}>Agreement</button>
                      {isAdmin && <button style={deleteButton} onClick={() => deleteClient(client)}>Delete</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
                      <input defaultValue={client.amountPaid} onBlur={e => updatePayment(client, e.target.value)} />
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

      {activeTab === 'documents' && (
        <section style={card}>
          <h2>Client Documents</h2>
          <div style={grid2}>
            <label style={labelStyle}>
              Select Client
              <select
                style={input}
                value={documentClientId}
                onChange={e => {
                  setDocumentClientId(e.target.value)
                  loadClientDocuments(e.target.value)
                }}
              >
                <option value="">Select client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.clientNo} - {client.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Document Type
              <select style={input} value={documentType} onChange={e => setDocumentType(e.target.value)}>
                <option>SA ID</option>
                <option>Payslip</option>
                <option>Bank Statement</option>
                <option>Signed Agreement</option>
                <option>Debit Mandate</option>
                <option>Proof of Payment</option>
                <option>Other</option>
              </select>
            </label>

            <label style={labelStyle}>
              Upload Document
              <input style={input} type="file" onChange={uploadClientDocument} disabled={uploading} />
            </label>
          </div>

          {uploading && <p>Uploading document...</p>}

          <h3>Uploaded Documents</h3>

          <table style={table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>File Name</th>
                <th>Uploaded</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {documents.map(doc => (
                <tr key={doc.id}>
                  <td>{doc.document_type}</td>
                  <td>{doc.file_name}</td>
                  <td>{new Date(doc.created_at).toLocaleString()}</td>
                  <td>
                    <button style={selectButton} onClick={() => openDocument(doc.file_path)}>View</button>
                    {isAdmin && <button style={deleteButton} onClick={() => deleteDocument(doc)}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'staff' && isAdmin && (
        <section style={card}>
          <h2>Staff Management</h2>
          <button style={primaryButton} onClick={loadStaffProfiles}>Refresh Staff List</button>

          <table style={table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Change Role</th>
                <th>Access</th>
              </tr>
            </thead>

            <tbody>
              {staffProfiles.map(staff => (
                <tr key={staff.id}>
                  <td>{staff.email}</td>
                  <td><span style={staff.role === 'admin' ? approvedBadge : statusBadge}>{staff.role}</span></td>
                  <td><span style={staff.status === 'active' ? approvedBadge : declinedBadge}>{staff.status || 'active'}</span></td>
                  <td>{staff.created_at ? new Date(staff.created_at).toLocaleString() : ''}</td>
                  <td>
                    <button
                      style={selectButton}
                      onClick={() =>
                        updateStaffProfile(staff.id, {
                          role: staff.role === 'admin' ? 'staff' : 'admin'
                        })
                      }
                    >
                      Make {staff.role === 'admin' ? 'Staff' : 'Admin'}
                    </button>
                  </td>
                  <td>
                    <button
                      style={staff.status === 'disabled' ? editButton : deleteButton}
                      onClick={() =>
                        updateStaffProfile(staff.id, {
                          status: staff.status === 'disabled' ? 'active' : 'disabled'
                        })
                      }
                    >
                      {staff.status === 'disabled' ? 'Activate' : 'Disable'}
                    </button>
                  </td>
                </tr>
              ))}
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

function Agreement({ client, result }) {
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
      <p><b>Service Fee 35%:</b> {money(result.fee)}</p>
      <p><b>Total Repayable:</b> {money(result.totalRepayable)}</p>
      <p><b>Repayment Date:</b> {client.dueDate}</p>
      <p><b>Bank:</b> {client.bankName}</p>
      <p><b>Account Holder:</b> {client.accountHolder}</p>
      <p><b>Account Number:</b> {client.accountNumber}</p>
      <p><b>DebiCheck Status:</b> {client.debicheckStatus}</p>
      <p><b>Mandate Ref:</b> {client.mandateRef}</p>
      <p><b>POPIA Consent:</b> {client.consentPopia ? 'Yes' : 'No'}</p>
      <p><b>Credit Check Consent:</b> {client.consentCreditCheck ? 'Yes' : 'No'}</p>

      <p>
        The Borrower confirms that information provided is true and correct and gives consent
        for JPrime Finance to process personal information for loan assessment purposes.
      </p>

      <p>Borrower Signature: __________________________</p>
      <p>Representative Signature: _____________________</p>

      <button onClick={() => window.print()} style={primaryButton}>Print Agreement</button>
      <button onClick={() => generateLoanAgreementPDF(client, result)} style={goldButton}>Download PDF Agreement</button>
      <button onClick={() => generateDebitMandatePDF(client, result)} style={goldButton}>Download Debit Mandate PDF</button>
    </div>
  )
}

const loginBackground = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#031f14',
  backgroundImage: `
    radial-gradient(circle at 20% 20%, rgba(201,162,63,0.5) 0 2px, transparent 3px),
    radial-gradient(circle at 80% 25%, rgba(255,255,255,0.35) 0 2px, transparent 3px),
    radial-gradient(circle at 30% 75%, rgba(201,162,63,0.35) 0 2px, transparent 3px),
    linear-gradient(135deg, rgba(2,44,26,0.96), rgba(0,0,0,0.9))
  `,
  backgroundSize: '180px 180px, 220px 220px, 260px 260px, cover',
  padding: 25,
  fontFamily: 'Arial',
  position: 'relative',
  overflow: 'hidden'
}

const nodeLayer = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `
    linear-gradient(60deg, rgba(201,162,63,0.18) 1px, transparent 1px),
    linear-gradient(120deg, rgba(255,255,255,0.08) 1px, transparent 1px)
  `,
  backgroundSize: '120px 120px',
  opacity: 0.6
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
  color: 'white',
  position: 'relative',
  zIndex: 2
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

const loginTitle = { fontSize: 44, margin: 0, color: '#c9a23f', fontWeight: 800 }
const loginSubtitle = { marginTop: 8, color: '#e8e8e8', fontSize: 15 }
const loginHeading = { fontSize: 30, marginTop: 35, marginBottom: 22 }
const loginFields = { display: 'flex', flexDirection: 'column', gap: 15 }
const loginInput = { padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 16, outline: 'none' }
const loginButton = { background: '#063d27', color: 'white', padding: 16, border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }
const signupButton = { background: '#c9a23f', color: '#000', padding: 16, border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }
const authNotice = { marginTop: 18, background: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 10 }
const loginFooter = { marginTop: 25, color: '#ddd', fontSize: 13, lineHeight: 1.6 }

const page = { fontFamily: 'Arial', background: '#f4f6f4', minHeight: '100vh', padding: 25 }
const header = { background: '#063d27', color: 'white', padding: 25, borderRadius: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const title = { margin: 0, color: '#c9a23f' }
const subtitle = { margin: 0 }
const roleBadge = { display: 'inline-block', background: '#c9a23f', color: '#000', padding: '5px 10px', borderRadius: 8, fontWeight: 'bold', marginTop: 8 }
const tabs = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }
const tab = { padding: '10px 15px', border: '1px solid #ccc', borderRadius: 8, background: 'white', cursor: 'pointer' }
const tabActive = { ...tab, background: '#063d27', color: 'white' }
const card = { background: 'white', padding: 25, borderRadius: 18, marginTop: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflowX: 'auto' }
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
const consentBox = { background: '#fff2cc', padding: 18, borderRadius: 15, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, fontWeight: 'bold' }
const table = { width: '100%', borderCollapse: 'collapse' }
const approvedBadge = { background: '#0b6b3a', color: 'white', padding: '5px 10px', borderRadius: 8 }
const declinedBadge = { background: '#b00020', color: 'white', padding: '5px 10px', borderRadius: 8 }
const statusBadge = { background: '#555', color: 'white', padding: '5px 10px', borderRadius: 8 }
const editButton = { background: '#063d27', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, marginRight: 6, cursor: 'pointer' }
const selectButton = { background: '#c9a23f', color: '#000', border: 'none', padding: '8px 12px', borderRadius: 8, marginRight: 6, cursor: 'pointer' }
const deleteButton = { background: '#b00020', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }
const agreementBox = { border: '1px solid #ccc', borderRadius: 15, padding: 25 }
const smallText = { fontSize: 12, color: '#555', marginTop: 10 }
