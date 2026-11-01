// Show diagnostic codes and the failing stage, never credential payloads.
export function describeAuthError(error, stage) {
  const raw=String(error?.message || error || '');
  const provider=/yahoo/i.test(stage)?'Yahoo':/github/i.test(stage)?'GitHub':'Google';
  const detail=`${error?.code || ''} ${raw}`.replace(/_/g,'-');
  const code=String(error?.code || detail.match(/auth\/[\w-]+|DEVELOPER_ERROR|\b12500\b|\b12501\b|\b10(?=:)/)?.[0] || 'kod yok')
    .replace(/[^a-zA-Z0-9_\-/ .]/g,'').slice(0,90);
  let message='Giriş tamamlanamadı. Bu hata bilgisini paylaşarak sorunu incelememizi sağlayabilirsin.';
  if(/account[-_]exists[-_]with[-_]different[-_]credential|credential[-_]already[-_]in[-_]use/i.test(detail))message='Bu kimlik başka bir giriş yöntemiyle kayıtlı olabilir. Mevcut Google/GitHub/Yahoo giriş yönteminle devam et. Hesapları otomatik birleştirmiyoruz.';
  else if(/popup[-_]blocked/i.test(detail))message='Giriş penceresi engellendi. Tarayıcıda bu site için açılır pencereye izin verip yeniden dene.';
  else if(/unauthorized[-_]domain|invalid[-_]oauth[-_]client[-_]id|invalid[-_]credential/i.test(detail))message=provider+' OAuth yapılandırması doğrulanamadı. Firebase sağlayıcısı ve yetkilendirme callback adresi kontrol edilmeli.';
  else if(/missing-yahoo-credential|yahoo-session-mismatch/i.test(detail))message='Yahoo oturumu doğrulanamadı. Yeniden dene; sürerse Firebase Yahoo sağlayıcısının ayarları kontrol edilmeli.';
  else if(/missing-github-credential|github-session-mismatch/i.test(detail))message='GitHub oturumu doğrulanamadı. Yeniden dene; sürerse Firebase GitHub sağlayıcısının ayarları kontrol edilmeli.';
  else if(/cancel|12501|closed-by-user/i.test(detail))message='Giriş iptal edildi. İstersen tekrar deneyebilirsin.';
  else if(/no credentials? available|NoCredentialException/i.test(detail))message='Google hesabı bulunamadı. Cihazdaki Google hesabını ve Google Play Hizmetleri güncellemelerini kontrol et.';
  else if(/network|NETWORK_ERROR/i.test(detail))message=provider+' bağlantısı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.';
  else if(/10:|DEVELOPER_ERROR|12500|configuration/i.test(detail))message=provider+' giriş yapılandırması reddedildi. Bu hata tek başına parmak izinin eksik olduğunu göstermez; OAuth istemcisi ve Firebase ayarları incelenmeli.';
  else if(/operation-not-allowed/i.test(detail))message='Firebase bu giriş yöntemine izin vermiyor. '+provider+' sağlayıcısının etkinliği kontrol edilmeli.';
  return `${message} (Aşama: ${stage}; Kod: ${code}; Sürüm: 1.11.1)`;
}
