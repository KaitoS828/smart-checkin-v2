'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Reservation } from '@/lib/supabase/types';
import { useI18n } from '@/lib/i18n/context';

interface GuestInfoFormProps {
  reservation: Reservation;
  onGuestInfoSubmitted: (updatedReservation: Reservation) => void;
}

export default function GuestInfoForm({
  reservation,
  onGuestInfoSubmitted,
}: GuestInfoFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  // We still need to construct the full string for guestName and guestNameKana to pass back,
  // but we'll manage them as separate states in the form.
  const initialNameSplit = (reservation.guest_name || '').split(' ');
  const initialKanaSplit = (reservation.guest_name_kana || '').split(' ');
  
  const [lastName, setLastName] = useState(initialNameSplit[0] || '');
  const [firstName, setFirstName] = useState(initialNameSplit[1] || initialNameSplit.slice(1).join(' ') || '');
  const [lastNameKana, setLastNameKana] = useState(initialKanaSplit[0] || '');
  const [firstNameKana, setFirstNameKana] = useState(initialKanaSplit[1] || initialKanaSplit.slice(1).join(' ') || '');
  
  const [guestAddress, setGuestAddress] = useState(reservation.guest_address || '');
  const [guestAddressDetail, setGuestAddressDetail] = useState(''); // Newly added, handled simply by concatenating
  const [gender, setGender] = useState(reservation.guest_gender || '');
  
  const [guestContact, setGuestContact] = useState(reservation.guest_contact || '');
  const [checkInTime, setCheckInTime] = useState(reservation.check_in_time || '');
  const [guestOccupation, setGuestOccupation] = useState(reservation.guest_occupation || '');
  const [isForeignNational, setIsForeignNational] = useState(reservation.is_foreign_national || false);
  const [nationality, setNationality] = useState(reservation.nationality || '');
  const [passportNumber, setPassportNumber] = useState(reservation.passport_number || '');
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(reservation.passport_image_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [tempReservation, setTempReservation] = useState<Reservation | null>(null);

  // When updating address detail, we just consider the whole address string 
  // to be `guestAddress + " " + guestAddressDetail` for DB sake.
  // We'll manage it loosely for this iteration.
  
  const isAlreadySubmitted = Boolean(reservation.guest_name);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isForeignNational) {
        if (!nationality) {
          throw new Error(t('guest.nationality'));
        }
        if (!passportNumber) {
          throw new Error(t('guest.passportNumber'));
        }
      }

      if (isForeignNational && passportFile) {
        const formData = new FormData();
        formData.append('file', passportFile);
        formData.append('reservationId', reservation.id);

        const uploadResponse = await fetch('/api/upload/passport', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          throw new Error(uploadData.error || 'Upload failed');
        }
      }

      // combine the name strings
      const combinedName = `${lastName} ${firstName}`.trim();
      const combinedNameKana = `${lastNameKana} ${firstNameKana}`.trim();
      
      // combine address
      const combinedAddress = guestAddressDetail ? `${guestAddress} ${guestAddressDetail}` : guestAddress;

      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: combinedName,
          guest_name_kana: combinedNameKana,
          guest_address: combinedAddress,
          guest_contact: guestContact,
          guest_occupation: guestOccupation,
          guest_gender: gender,
          is_foreign_national: isForeignNational,
          nationality: isForeignNational ? nationality : undefined,
          passport_number: isForeignNational ? passportNumber : undefined,
          check_in_time: checkInTime || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update guest information');
      }

      setTempReservation(data.reservation);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('guest.title')}</h2>
        <p className="text-sm text-text-secondary">{t('guest.subtitle')}</p>
      </div>

      {isAlreadySubmitted && (
        <div className="bg-success/5 border border-success/20 rounded-lg p-3">
          <p className="text-sm text-success font-medium">{t('guest.alreadyRegistered')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. 外国人チェックボックス（最優先） */}
        <div className="border border-border rounded-lg p-4 bg-surface-secondary/30 transition-colors hover:bg-surface-secondary/50">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_foreign" checked={isForeignNational} onChange={(e) => setIsForeignNational(e.target.checked)} className="w-5 h-5 cursor-pointer rounded border-border text-foreground focus:ring-foreground" disabled={isLoading} />
            <label htmlFor="is_foreign" className="text-sm font-semibold text-foreground cursor-pointer select-none flex-1">
              {t('guest.foreignNational')}
            </label>
          </div>
        </div>

        {/* 2. 外国人の場合のパスポート情報 */}
        {isForeignNational && (
          <div className="border border-border rounded-lg p-4 space-y-4 animate-fade-in bg-primary/5 border-primary/20">
            <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-foreground mb-1.5">
                {t('guest.nationality')} <span className="text-danger">*</span>
              </label>
              <input type="text" id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputClass} placeholder={t('guest.nationalityPlaceholder')} disabled={isLoading} />
            </div>

            <div>
              <label htmlFor="passport_number" className="block text-sm font-medium text-foreground mb-1.5">
                {t('guest.passportNumber')} <span className="text-danger">*</span>
              </label>
              <input type="text" id="passport_number" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} className={inputClass} placeholder={t('guest.passportNumberPlaceholder')} disabled={isLoading} />
            </div>

            <div>
              <label htmlFor="passport_image" className="block text-sm font-medium text-foreground mb-1.5">
                {t('guest.passportImage')} <span className="text-danger">*</span>
              </label>
              <input type="file" id="passport_image" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleFileChange} className="block w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-border file:text-sm file:font-medium file:bg-surface-secondary file:text-foreground hover:file:bg-border file:cursor-pointer" disabled={isLoading} />
              <p className="mt-1 text-xs text-text-muted">{t('guest.passportImageNote')}</p>

              {passportPreview && (
                <div className="mt-3 rounded-lg overflow-hidden border border-border bg-surface-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={passportPreview} alt="Passport" className="w-full max-h-48 object-contain" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 基本情報 */}
        <div className="border border-border rounded-lg p-4 space-y-4">
          <p className="text-sm font-semibold text-foreground">{t('guest.basicInfo')}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-foreground mb-1.5">
                {t('guest.lastName')} <span className="text-danger">*</span>
              </label>
              <input type="text" id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder={t('guest.lastNamePlaceholder')} required disabled={isLoading} />
            </div>
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-foreground mb-1.5">
                {t('guest.firstName')} <span className="text-danger">*</span>
              </label>
              <input type="text" id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder={t('guest.firstNamePlaceholder')} required disabled={isLoading} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="last_name_kana" className="block text-sm font-medium text-foreground mb-1.5">
                {t('guest.lastNameKana')} <span className="text-danger">*</span>
              </label>
              <input type="text" id="last_name_kana" value={lastNameKana} onChange={(e) => setLastNameKana(e.target.value)} className={inputClass} placeholder={t('guest.lastNameKanaPlaceholder')} required disabled={isLoading} />
            </div>
            <div>
              <label htmlFor="first_name_kana" className="block text-sm font-medium text-foreground mb-1.5">
                {t('guest.firstNameKana')} <span className="text-danger">*</span>
              </label>
              <input type="text" id="first_name_kana" value={firstNameKana} onChange={(e) => setFirstNameKana(e.target.value)} className={inputClass} placeholder={t('guest.firstNameKanaPlaceholder')} required disabled={isLoading} />
            </div>
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-foreground mb-1.5">
              {t('guest.gender')} <span className="text-danger">*</span>
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[position:right_10px_center] bg-no-repeat pr-10`}
              required
              disabled={isLoading}
            >
              <option value="" disabled>{t('guest.genderSelect')}</option>
              <option value="male">{t('guest.genderMale')}</option>
              <option value="female">{t('guest.genderFemale')}</option>
              <option value="other">{t('guest.genderOther')}</option>
              <option value="prefer_not_to_say">{t('guest.genderPreferNotToSay')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="guest_address" className="block text-sm font-medium text-foreground mb-1.5">
              {t('guest.address')} <span className="text-danger">*</span>
            </label>
            <input type="text" id="guest_address" value={guestAddress} onChange={(e) => setGuestAddress(e.target.value)} className={inputClass} placeholder={t('guest.addressPlaceholder')} required disabled={isLoading} />
          </div>

          <div>
            <label htmlFor="guest_address_detail" className="block text-sm font-medium text-foreground mb-1.5">
              {t('guest.addressDetail')} <span className="text-danger">*</span>
            </label>
            <input type="text" id="guest_address_detail" value={guestAddressDetail} onChange={(e) => setGuestAddressDetail(e.target.value)} className={inputClass} placeholder={t('guest.addressDetailPlaceholder')} required disabled={isLoading} />
          </div>

          <div>
            <label htmlFor="guest_occupation" className="block text-sm font-medium text-foreground mb-1.5">
              {t('guest.occupation')} <span className="text-danger">*</span>
            </label>
            <input type="text" id="guest_occupation" value={guestOccupation} onChange={(e) => setGuestOccupation(e.target.value)} className={inputClass} placeholder={t('guest.occupationPlaceholder')} required disabled={isLoading} />
          </div>

          <div>
            <label htmlFor="guest_contact" className="block text-sm font-medium text-foreground mb-1.5">
              {t('guest.contact')} <span className="text-danger">*</span>
            </label>
            <input type="tel" id="guest_contact" value={guestContact} onChange={(e) => setGuestContact(e.target.value)} className={inputClass} placeholder={t('guest.contactPlaceholder')} required disabled={isLoading} />
          </div>

          <div>
            <label htmlFor="check_in_time" className="block text-sm font-medium text-foreground mb-1.5">
              チェックイン予定時間
            </label>
            <input
              type="time"
              id="check_in_time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className={inputClass}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-text-muted">
              ご到着予定の時間を入力してください（任意）
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-danger/5 border border-danger/20 p-3">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? t('common.submitting') : isAlreadySubmitted ? t('guest.update') : t('guest.submit')}
        </button>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-scale-up">
            <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2">
              {t('guest.submitSuccessTitle')}
            </h3>
            
            <p className="text-sm text-text-secondary mb-8">
              {t('guest.submitSuccessDesc')}
            </p>
            
            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (tempReservation) {
                  onGuestInfoSubmitted(tempReservation);
                }
              }}
              className="w-full py-3 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              シークレットコードを確認する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
