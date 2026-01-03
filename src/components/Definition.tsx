export default function Definition() {
  return (
    <>
      <div className="container px-4 lg:mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left column with one card */}
          <div className="flex flex-col items-center justify-center rounded-lg border border-gray-300/50 bg-white/10 p-15 shadow-md backdrop-blur-md">
            <div className="mb-10">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M36.8008 13.9238L38.6621 15.916L41.3867 15.8232L48.4141 15.585L48.1768 22.6133L48.084 25.3379L50.0762 27.1992L55.2119 32L50.0762 36.8008L48.084 38.6621L48.1768 41.3867L48.4141 48.4141L41.3867 48.1768L38.6621 48.084L36.8008 50.0762L32 55.2119L27.1992 50.0762L25.3379 48.084L22.6133 48.1768L15.585 48.4141L15.8232 41.3867L15.916 38.6621L13.9238 36.8008L8.78711 32L13.9238 27.1992L15.916 25.3379L15.8232 22.6133L15.585 15.585L22.6133 15.8232L25.3379 15.916L27.1992 13.9238L32 8.78711L36.8008 13.9238Z"
                  stroke="#F3B610"
                  strokeWidth="12"
                />
              </svg>
            </div>
            <h2 className="mb-2 font-kufam text-3xl font-medium text-foreground">
              الرؤية
            </h2>
            <p className="text-center text-xl text-foreground/80">
              إن نادي سراج هو مشروع إحياء للصلة بالله وتجديد لمعنى العبودية في
              حياة الشاب الجامعي. وُلد من شعور صادق بالمسؤولية تجاه أمة تُستضعف
              وواقعٍ يموج بالأزمات، ودافعٍ يعيد للطالب وعيه برسالته؛ رسالة
              الإسلام التي تبني الإنسان بناءً شاملا: علما يهدي، فكرا يرشد، روحا
              تزكّى، ونفسا تعمر الأرض بالخير.
            </p>
          </div>
          {/* Right column with two cards */}
          <div className="flex flex-col gap-8 md:col-span-2">
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-300/50 bg-white/10 p-15 shadow-md backdrop-blur-md">
              <div className="mb-10">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="64" height="64" fill="#F3B610" />
                  <path
                    d="M39.7357 51.9465L31.8562 43.5003L23.9767 51.9465L12.4727 51.4772L11.9999 40.6848L20.5098 32.7079L11.9999 24.8873L12.4727 13.6256L23.9767 13L31.8562 21.4462L39.7357 13L51.0821 13.6256L51.5549 24.8873L43.0451 32.7079L51.5549 40.6848L51.0821 51.4772L39.7357 51.9465Z"
                    fill="white"
                  />
                </svg>
              </div>
              <h2 className="mb-2 font-kufam text-3xl font-medium text-foreground">
                المبدأ
              </h2>
              <p className="max-w-3xl text-center text-xl text-foreground/80">
                القرآن هو لبّ هذا المشروع؛ نعيش معه تدبّرا وتزكية ليكون محور
                الأنشطة. وتأتي السنة النبوية كمنهج تربوي بنائي وإصلاحي. كما يقوم
                النادي على رفض للانغلاق وللذوبان، وجمع بين العقل المفكر والقلب
                الذاكر.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-300/50 bg-white/10 p-15 shadow-md backdrop-blur-md">
              <div className="mb-10">
                <svg
                  width="61"
                  height="64"
                  viewBox="0 0 61 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M35.4241 10.8779L36.9465 11.9551L38.8118 11.9785L44.9231 12.0566L46.886 17.8447L47.4856 19.6113L48.9797 20.7266L53.8782 24.3818L52.0647 30.2188L51.511 32L52.0647 33.7812L53.8782 39.6172L48.9797 43.2734L47.4856 44.3887L46.886 46.1553L44.9231 51.9424L38.8118 52.0215L36.9465 52.0449L35.4241 53.1221L30.4338 56.6504L25.4436 53.1221L23.9211 52.0449L22.0559 52.0215L15.9436 51.9424L13.9817 46.1553L13.3821 44.3887L11.8879 43.2734L6.98853 39.6172L8.80298 33.7812L9.35669 32L8.80298 30.2188L6.98853 24.3818L11.8879 20.7266L13.3821 19.6113L13.9817 17.8447L15.9436 12.0566L22.0559 11.9785L23.9211 11.9551L25.4436 10.8779L30.4338 7.34863L35.4241 10.8779Z"
                    stroke="#F3B610"
                    strokeWidth="12"
                  />
                </svg>
              </div>
              <h2 className="mb-2 font-kufam text-3xl font-medium text-foreground">
                الهدف
              </h2>
              <p className="max-w-3xl text-center text-xl text-foreground/80">
                النادي تربوي علمي دعوي مجتمعي؛ يجمع بين تزكية النفس وتنمية الوعي
                وخدمة الناس بأنشطة تُترجم الإيمان إلى أثر. كما يركز على تنمية
                المهارات الأساسية مثل التواصل والعمل الجماعي والقيادة. والانضمام
                إليه هو دخول في رحلة إيمانية وعملية، تقوم على النية
                المخلصة والصحبة الصالحة وصدق الهمة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
