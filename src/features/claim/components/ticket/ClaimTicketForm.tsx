import { Button } from '@chakra-ui/react';

import { useClaimForm } from '../ClaimFormContext';

import { useClaimTicketFlow } from './ClaimTicketFlowContext';

export interface ClaimTicketFormFieldTypes {
  name: string;
  email: string;
}

interface ClaimTicketFormProps {}

export const ClaimTicketForm = ({}: ClaimTicketFormProps) => {
  const { onNext } = useClaimTicketFlow();

  const { getClaimFormData } = useClaimForm();
  // const { handleSubmit, control } = useFormContext<ClaimTicketFormFieldTypes>();

  const handleSubmitClick = () => {
    // TODO: handle name/email validation and send email
    console.log(getClaimFormData());
    onNext();
  };

  return (
    <form
      style={{ width: '100%' }}
      onSubmit={handleSubmitClick}
      // onSubmit={handleSubmit(handleSubmitClick)}
    >
      {/* <VStack mb="8" spacing="4" w="full">
        <NameField control={control} />
        <EmailField control={control} />
      </VStack> */}
      <Button type="submit" w="full">
        Show me my ticket
      </Button>
    </form>
  );
};
