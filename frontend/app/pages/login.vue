<script setup lang="ts">
import { z } from 'zod';

definePageMeta({
  layout: false,
  middleware: ['not-authorized'],
});

const userStore = useUserStore();

const { handleSubmit, isSubmitting, resetForm, setErrors } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      userName: z.string().min(3, 'Username must be at least 3 characters long'),
      password: z.string().min(6, 'Password must be at least 6 characters long'),
    })
  ),
});

const onSubmit = handleSubmit(async (values) => {
  try {
    await userStore.login(values.userName, values.password);
    navigateTo('/');
  } catch (error) {
    console.error("Login error:", error);
    resetForm();
    setErrors({
      userName: 'Invalid username or password',
      password: 'Invalid username or password',
    });
  }
});
</script>

<template>
  <div class="flex h-full">
    <Card class="m-a w-full max-w-[25rem]">
      <template #title>Login</template>
      <template #content>
        <form class="flex flex-col gap-4 mt-4" @submit="onSubmit">
          <FormInputText name="userName" label="Username" />
          <FormInputText name="password" label="Password" type="password" />
          <Button
            label="Login"
            class="mt-2"
            type="submit"
            :icon="isSubmitting ? 'pi pi-spin pi-spinner' : ''"
            :disabled="isSubmitting"
          />
        </form>
      </template>
    </Card>
  </div>
</template>