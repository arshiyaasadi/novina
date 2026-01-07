/**
 * نمونه کامپوننت Card با Tailwind CSS
 * این فایل فقط به عنوان نمونه است و می‌توانید از آن کپی کنید
 */

export function CardExample() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-2">عنوان کارت</h3>
      <p className="text-gray-600 dark:text-gray-300">
        محتوای کارت در اینجا قرار می‌گیرد.
      </p>
    </div>
  );
}

