# Functional Requirement Document (FRD) - Fase 2

**Proyecto:** Monagas  
**Versión:** 2.0  
**Autor:** Player 4 (Product Manager)  
**Fecha:** Mayo 2026

---

## NUEVO: Requisitos Funcionales Fase 2

### RF-009: Notificaciones Push

**Descripción:** Los usuarios deben recibir notificaciones push en tiempo real.  
**Prioridad:** Alta  
**Actor:** Todos los usuarios  

**Criterios de Aceptación:**
- [ ] El sistema debe solicitar permiso para notificaciones
- [ ] El sistema debe guardar FCM token en Firestore
- [ ] El sistema debe notificar gerente cuando evaluación se envía
- [ ] El sistema debe notificar operador cuando evaluación es aprobada/rechazada
- [ ] El sistema debe mostrar notificación en foreground y background
- [ ] El sistema debe sonar al recibir notificación
- [ ] El sistema debe abrir evaluación al click en notificación

---

### RF-010: Analytics

**Descripción:** El sistema debe rastrear eventos para análisis.  
**Prioridad:** Media  
**Actor:** Todos los usuarios  

**Criterios de Aceptación:**
- [ ] El sistema debe loggear login event
- [ ] El sistema debe loggear create_evaluation event
- [ ] El sistema debe loggear approval event
- [ ] El sistema debe loggear export event
- [ ] El sistema debe logear offline_sync event
- [ ] El sistema debe set user properties (rol, supervisorId)

---

**Fin del FRD v2.0**
