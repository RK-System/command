// Cria um usuário Administrador (user_type = 1)
 await createTestUser(
   client,
   'Robson',
   'robson@example.com',
   process.env.SENHA_SECRETA_1,
   1
 );

 // Cria um usuário funcionário (user_type = 2)
 await createTestUser(
   client,
   'João',
   'joao@example.com',
   process.env.SENHA_SECRETA_2,
   2
 );

 // Cria um usuário comum (user_type = 3)
 await createTestUser(
   client,
   'Cliente',
   'cliente@example.com',
   process.env.SENHA_SECRETA_3,
   3
 );
 // Cria um usuário auxilar de cozinha (user_type = 4)
 await createTestUser(
   client,
   'Cheff',
   'cheff@example.com',
   process.env.SENHA_SECRETA_4,
   4
 );
