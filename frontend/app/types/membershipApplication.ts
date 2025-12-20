export type MembershipStatus = 'pending' | 'approved' | 'rejected'
export type MembershipType = 'regular' | 'supporting'

export type MembershipApplication = {
  id: number
  firstName: string
  lastName: string
  birthDate: string
  email: string
  phone?: string
  street: string
  postalCode: string
  city: string
  country: string
  iban: string
  bic?: string
  accountHolder: string
  membershipType: MembershipType
  signatureData?: string
  signatureTimestamp?: string
  signatureIp?: string
  status: MembershipStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export type DeleteMembershipApplicationResponse = Pick<MembershipApplication, 'id'>
export type UpdateMembershipApplicationStatusResponse = Pick<MembershipApplication, 'id' | 'status'>
export type AddMembershipApplicationResponse = MembershipApplication
export type UpdateMembershipApplicationResponse = MembershipApplication
