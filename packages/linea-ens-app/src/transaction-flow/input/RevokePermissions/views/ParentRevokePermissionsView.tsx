import { Control, UseFormRegister, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  ChildFuseKeys,
  ChildFuseReferenceType,
  ParentFuseReferenceType,
} from '@ensdomains/ensjs/utils'

import { CheckboxRow } from '@app/components/@molecules/CheckBoxRow/CheckBoxRow'
import { Dialog } from '@app/components/@organisms/Dialog/Dialog'

import type { FormData } from '../RevokePermissions-flow'

type Props = {
  register: UseFormRegister<FormData>
  control: Control<FormData>
  unburnedFuses: (ChildFuseReferenceType['Key'] | ParentFuseReferenceType['Key'])[]
}

const CHILD_FUSES_WITHOUT_CU: ChildFuseReferenceType['Key'][] = ChildFuseKeys.filter(
  (fuse) => fuse !== 'CANNOT_UNWRAP',
)

const PermissionsList = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    gap: ${theme.space[2]};
  `,
)

export const ParentRevokePermissionsView = ({ register, control, unburnedFuses }: Props) => {
  const { t } = useTranslation('transactionFlow')

  const unwrapped = useWatch({ control, name: 'childFuses.CANNOT_UNWRAP' })

  const isCEEUnburned = unburnedFuses.includes('CAN_EXTEND_EXPIRY')

  return (
    <>
      <Dialog.Heading title={t('input.revokePermissions.views.revokePermissions.title')} />
      <PermissionsList>
        {isCEEUnburned && (
          <CheckboxRow
            data-testid="checkbox-CAN_EXTEND_EXPIRY"
            label={t('input.revokePermissions.views.revokePermissions.fuses.CAN_EXTEND_EXPIRY')}
            {...register(`parentFuses.CAN_EXTEND_EXPIRY`)}
          />
        )}
        <CheckboxRow
          data-testid="checkbox-CANNOT_UNWRAP"
          label={t('input.revokePermissions.views.revokePermissions.fuses.CANNOT_UNWRAP')}
          {...register('childFuses.CANNOT_UNWRAP')}
        />
        {CHILD_FUSES_WITHOUT_CU.map((fuse) => (
          <CheckboxRow
            data-testid={`checkbox-${fuse}`}
            key={fuse}
            label={t(`input.revokePermissions.views.revokePermissions.fuses.${fuse}`)}
            disabled={!unwrapped}
            {...register(`childFuses.${fuse}`)}
          />
        ))}
      </PermissionsList>
    </>
  )
}
