// Show diagnostic codes and the failing stage, never credential payloads.
export function describeAuthError(error, stage) {
  const raw=String(error?.message || error || '');
  const detail=`${error?.code || ''} ${raw}`;
  const code=String(error?.code || detail.match(/auth\/[\w-]+|DEVELOPER_ERROR|\b12500\b|\b12501\b|\b10(?=:)/)?.[0] || 'kod yok')
    .replace(/[^a-zA-Z0-9_\-/ .]/g,'').slice(0,90);
  let message='Giriş tamamlanamadı. Bu hata bilgisini paylaşarak sorunu incelememizi sağlayabilirsin.';
  if(/cancel|12501|closed-by-user/i.test(detail))message='Giriş iptal edildi. İstersen tekrar deneyebilirsin.';
  else if(/no credentials? available|NoCredentialException/i.test(detail))message='Google hesabı bulunamadı. Cihazdaki Google hesabını ve Google Play Hizmetleri güncellemelerini kontrol et.';
  else if(/network|NETWORK_ERROR/i.test(detail))message='Google bağlantısı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.';
  else if(/10:|DEVELOPER_ERROR|12500|configuration/i.test(detail))message='Google giriş yapılandırması reddedildi. Bu hata tek başına parmak izinin eksik olduğunu göstermez; OAuth istemcisi ve Firebase ayarları incelenmeli.';
  else if(/operation-not-allowed/i.test(detail))message='Firebase bu giriş yöntemine izin vermiyor. Google sağlayıcısının etkinliği kontrol edilmeli.';
  return `${message} (Aşama: ${stage}; Kod: ${code}; Sürüm: 1.5.2)`;
}
