// Keep Credential Manager as the default. Some devices/accounts return no
// credentials; only then retry with the plugin's legacy Google account picker.
export async function nativeGoogleSignIn(provider) {
  try {
    return await provider.signInWithGoogle({useCredentialManager:true});
  } catch (error) {
    const detail=`${error?.code || ''} ${error?.message || ''}`;
    if (!/no credentials? available|NoCredentialException|TYPE_NO_CREDENTIAL/i.test(detail)) throw error;
    return provider.signInWithGoogle({useCredentialManager:false});
  }
}
