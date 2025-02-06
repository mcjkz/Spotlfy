import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { day, month, year } = await request.json();
    if (!day || !month || !year) {
      return
    }

    function sprawdzDate(year,month) {
      const dniWMiesiacu = [31, (year % 4 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      return dniWMiesiacu[month - 1];
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const dzienMiesiaca = sprawdzDate(year,month);
    if (
      year > currentYear-16 ||
      (year == currentYear-16 && month > currentMonth) ||
      (year == currentYear-16 && month == currentMonth && day > currentDay)
    ) {
      return NextResponse.json(
        { error: "1" },
        { status: 200 }
      );
    }
    else if( day > dzienMiesiaca){
      return NextResponse.json(
        { error: "2" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Data urodzenia jest poprawna." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd walidacji daty urodzenia:", error);
    return NextResponse.json(
      { error: "Błąd serwera podczas walidacji daty." },
      { status: 500 }
    );
  }
}
