import Swal from 'sweetalert2'

export const showDeleteConfirmation = async (itemName: string = 'data ini') => {
  const result = await Swal.fire({
    title: 'Apakah Anda yakin?',
    text: `Anda akan menghapus ${itemName}. Tindakan ini tidak dapat dibatalkan!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626', // Red color
    cancelButtonColor: '#6b7280', // Gray color
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'rounded-md',
      cancelButton: 'rounded-md'
    }
  })
  
  return result.isConfirmed
}

export const showSuccessMessage = (title: string, message: string) => {
  Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonColor: '#16a34a', // Green color
    confirmButtonText: 'OK',
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'rounded-md'
    }
  })
}

export const showErrorMessage = (title: string, message: string) => {
  Swal.fire({
    title,
    text: message,
    icon: 'error',
    confirmButtonColor: '#dc2626', // Red color
    confirmButtonText: 'OK',
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'rounded-md'
    }
  })
}

export const showLoadingMessage = (title: string = 'Memproses...') => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading()
    }
  })
}

export const closeLoadingMessage = () => {
  Swal.close()
} 