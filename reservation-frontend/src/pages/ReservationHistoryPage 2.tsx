import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { reservationApi } from "../api/reservationApi";
import type { Reservation } from "../types";
import { formatDateTime } from "../utils/dateUtils";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";

export const ReservationHistoryPage: React.FC = () => {
    const 
}