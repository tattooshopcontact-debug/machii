// Page de RETOUR apres la verification Didit : redirige (302) directement vers
// l'app via le deep link machii://. Dans le navigateur d'auth (openAuthSession),
// cela referme le navigateur et rouvre l'app. Fini la page blanche.
Deno.serve(() => {
  return new Response(null, {
    status: 302,
    headers: { Location: 'machii://profile/verify' },
  });
});
