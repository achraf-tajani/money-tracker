import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { resetPassword } from '@/services';
import { ANIMATION_VARIANTS } from '@/lib/constants';

/**
 * Validation schema for forgot password form
 */
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Email invalide'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Forgot Password Page Component
 * Modern, animated password reset page with glassmorphism design
 */
export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  /**
   * Handle forgot password form submission
   */
  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await resetPassword(data.email);

      if (error) {
        toast.error(
          'Une erreur est survenue. Veuillez réessayer.',
          {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid #EF4444',
            },
          }
        );
        setIsLoading(false);
        return;
      }

      // Success
      setEmailSent(true);
      toast.success(
        'Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.',
        {
          duration: 5000,
          position: 'top-center',
          icon: '📧',
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid #10B981',
          },
        }
      );
      setIsLoading(false);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Une erreur inattendue est survenue', {
        duration: 4000,
        position: 'top-center',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-gradient">
      <Toaster />

      {/* Animated background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Forgot Password Card */}
      <motion.div
        className="w-full max-w-md relative z-10"
        variants={ANIMATION_VARIANTS.fadeInUp}
        initial="initial"
        animate="animate"
      >
        {/* Back to Login Link */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </motion.div>

        {/* Logo / Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-slate-300">
            {emailSent
              ? 'Email envoyé avec succès'
              : 'Entrez votre email pour réinitialiser'}
          </p>
        </motion.div>

        {/* Glass Card */}
        <motion.div
          className="glass-morphism rounded-2xl p-8 shadow-2xl backdrop-blur-xl bg-slate-900/40 border border-white/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          {emailSent ? (
            /* Success Message */
            <div className="text-center py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Send className="w-8 h-8 text-green-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Email envoyé !
              </h3>
              <p className="text-slate-300 mb-6">
                Vérifiez votre boîte de réception et suivez les instructions
                pour réinitialiser votre mot de passe.
              </p>
              <Link to="/login">
                <motion.button
                  type="button"
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Retour à la connexion
                </motion.button>
              </Link>
            </div>
          ) : (
            /* Form */
            <>
              <h2 className="text-2xl font-semibold text-white mb-6">
                Réinitialiser le mot de passe
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      autoFocus
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="votre@email.com"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <motion.p
                      className="mt-1.5 text-sm text-red-400"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>

                {/* Info Text */}
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                  <p className="text-sm text-slate-300">
                    Vous recevrez un email avec un lien pour créer un nouveau
                    mot de passe.
                  </p>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer le lien
                    </>
                  )}
                </motion.button>
              </form>
            </>
          )}
        </motion.div>

        {/* Footer */}
        {!emailSent && (
          <motion.p
            className="text-center text-slate-400 text-sm mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Vous vous souvenez de votre mot de passe ?{' '}
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Se connecter
            </Link>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
