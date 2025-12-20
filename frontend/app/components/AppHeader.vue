<script setup lang="ts">
const userStore = useUserStore()
const menu = useTemplateRef('menu')
const router = useRouter()

const initials = computed(
  () =>
    userStore.user?.name
      .split(' ')
      .map((word) => word[0]?.toUpperCase())
      .join('') ?? ''
)

const menuItems = ref([
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: (): void => {
      userStore.logout()
      navigateTo('/login')
    },
  },
])

function onMenuClick(event: Event): void {
  menu.value?.toggle(event)
}
</script>
<template>
  <Toolbar>
    <template #start>
      <div class="flex items-center gap-6">
        <span class="font-bold text-xl">Applica</span>
        <nav class="hidden md:flex gap-4">
          <Button
            label="Anträge"
            text
            @click="router.push('/')"
          />
          <Button
            label="Mitgliedsanträge"
            text
            @click="router.push('/memberships')"
          />
        </nav>
      </div>
    </template>
    <template #end>
      <Avatar
        class="cursor-pointer"
        type="button"
        :label="initials"
        aria-haspopup="true"
        aria-controls="overlay_menu"
        @click="onMenuClick"
      />
      <Menu ref="menu" :model="menuItems" popup />
    </template>
  </Toolbar>
</template>
