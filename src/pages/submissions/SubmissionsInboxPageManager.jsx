import { Navigate, useParams } from 'react-router-dom'
import SubmissionsInboxPage from '../../components/pages/submissions/SubmissionsInboxPage'

const VALID_SOURCES = new Set(['lead', 'contact', 'career'])
const VALID_STATUSES = new Set(['new', 'resolved', 'archived'])

const SubmissionsInboxPageManager = () => {
  const { source = '', status = '' } = useParams()

  if (!VALID_SOURCES.has(source) || !VALID_STATUSES.has(status)) {
    return <Navigate to="/submissions/lead/new" replace />
  }

  return <SubmissionsInboxPage source={source} status={status} />
}

export default SubmissionsInboxPageManager
